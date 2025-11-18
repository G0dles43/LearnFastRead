from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Avg, Count
from django.utils.text import slugify
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from .wpm_milestones import DEFAULT_WPM_LIMIT, get_next_wpm_limit, MIN_PASS_ACCURACY

class CustomUser(AbstractUser):

    speed = models.IntegerField(default=200)

    max_wpm_limit = models.IntegerField(
        default=DEFAULT_WPM_LIMIT, 
        help_text="Maksymalny odblokowany WPM przez użytkownika"
    )

    has_completed_calibration = models.BooleanField(
        default=False, 
        help_text="Czy użytkownik przeszedł pierwszą kalibrację ustawień"
    )

    muted = models.BooleanField(default=False)
    
    MODE_CHOICES = (
        ('rsvp', 'RSVP'),
        ('highlight', 'Highlight'),
        ('chunking', 'Chunking'), 
    )
    
    highlight_width = models.IntegerField(default=600)
    highlight_height = models.IntegerField(default=300)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='rsvp')
    chunk_size = models.IntegerField(default=3)
    
    total_ranking_points = models.IntegerField(default=0, help_text="Suma punktów z ZALICZONYCH prób (accuracy >= 60%)")
    ranking_exercises_completed = models.IntegerField(default=0, help_text="Liczba ZALICZONYCH prób rankingowych")
    average_wpm = models.FloatField(default=0, help_text="Średnie WPM z ZALICZONYCH prób")
    average_accuracy = models.FloatField(default=0, help_text="Średnia accuracy z ZALICZONYCH prób")

    current_streak = models.IntegerField(default=0, help_text="Aktualna seria codziennych treningów")
    max_streak = models.IntegerField(default=0, help_text="Najdłuższa osiągnięta seria")
    last_streak_date = models.DateField(null=True, blank=True, help_text="Data ostatniego treningu")

    def __str__(self):
        return self.username or self.email or f"User {self.id}"



class ReadingExercise(models.Model):
    title = models.CharField(max_length=100)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    favorited_by = models.ManyToManyField(CustomUser, related_name='favorite_exercises', blank=True)
    is_public = models.BooleanField(default=False)
    is_ranked = models.BooleanField(default=False)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    word_count = models.IntegerField(default=0, editable=False)
    
    def __str__(self):
        return self.title
    
    def get_recommended_questions(self):
        if self.word_count <= 300:
            return 3
        elif self.word_count <= 500:
            return 4
        elif self.word_count <= 800:
            return 5
        else:
            return 6
        
    def save(self, *args, **kwargs):
        self.word_count = len(self.text.split()) if self.text else 0
        super().save(*args, **kwargs)

class DailyChallenge(models.Model):
    """
    Model przechowujący wyzwanie dnia.
    Jedno wyzwanie = jeden dzień.
    """
    date = models.DateField(unique=True, help_text="Data wyzwania (YYYY-MM-DD)")
    exercise = models.ForeignKey(
        ReadingExercise, 
        on_delete=models.CASCADE, 
        limit_choices_to={'is_ranked': True, 'is_public': True},
        help_text="Ćwiczenie rankingowe na ten dzień"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name = "Wyzwanie Dnia"
        verbose_name_plural = "Wyzwania Dnia"

    def __str__(self):
        return f"Wyzwanie na {self.date}: {self.exercise.title}"

class Question(models.Model):
    QUESTION_TYPES = (
        ('open', 'Otwarte'),
        ('choice', 'Zamknięte (4 odpowiedzi)'),
    )
    
    exercise = models.ForeignKey(ReadingExercise, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='open')
    correct_answer = models.CharField(max_length=255)
    option_1 = models.CharField(max_length=255, blank=True, null=True)
    option_2 = models.CharField(max_length=255, blank=True, null=True)
    option_3 = models.CharField(max_length=255, blank=True, null=True)
    option_4 = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.text} ({self.get_question_type_display()})"
    
    def clean(self):
        if self.question_type == 'choice':
            options = [self.option_1, self.option_2, self.option_3, self.option_4]
            if not all(options):
                raise ValidationError("Dla pytania zamkniętego musisz podać 4 odpowiedzi.")
        elif self.question_type == 'open':
            if any([self.option_1, self.option_2, self.option_3, self.option_4]):
                raise ValidationError("Dla pytania otwartego nie podawaj opcji.")

class UserProgress(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="progress_records")
    exercise = models.ForeignKey(ReadingExercise, on_delete=models.CASCADE, related_name="progress_records")
    
    wpm = models.IntegerField(help_text="Słowa na minutę (obliczone z word_count / minuty)")
    accuracy = models.FloatField(help_text="Trafność w quizie (0-100)")
    completed_at = models.DateTimeField(auto_now_add=True)
    
    counted_for_ranking = models.BooleanField(default=False, help_text="Czy ten wynik liczy się do rankingu")
    attempt_number = models.IntegerField(default=1, help_text="Która to próba użytkownika dla tego ćwiczenia")
    ranking_points = models.IntegerField(default=0, help_text="Punkty rankingowe (0 jeśli accuracy < 60)")
    
    completed_daily_challenge = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-completed_at']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

class Achievement(models.Model):
    slug = models.CharField(max_length=100, unique=True, primary_key=True)
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon_name = models.CharField(max_length=50, default="🏆")

    def __str__(self):
        return self.title

class UserAchievement(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="achievements")
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="users")
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'achievement')

    def __str__(self):
        return f"{self.user.username} - {self.achievement.title}"
    
class ExerciseCollection(models.Model):
    title = models.CharField(max_length=150)
    slug = models.SlugField(unique=True, max_length=170, blank=True)
    description = models.TextField(blank=True)
    exercises = models.ManyToManyField(ReadingExercise, related_name='collections', blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='collections')
    icon_name = models.CharField(max_length=50, default="📚")
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while ExerciseCollection.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

class Friendship(models.Model):
    follower = models.ForeignKey(CustomUser, related_name='following', on_delete=models.CASCADE)
    followed = models.ForeignKey(CustomUser, related_name='followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'followed')

    def __str__(self):
        return f"{self.follower.username} follows {self.followed.username}"
    

class Notification(models.Model):
    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="notifications")
    actor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="actions")
    verb = models.CharField(max_length=255) 
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    target = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.target:
            return f"{self.actor} {self.verb} {self.target}"
        return f"{self.actor} {self.verb}"