from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Avg, Count
from django.utils.text import slugify

class CustomUser(AbstractUser):
    avatar = models.ImageField(
    upload_to='media/avatars/', 
    null=True, 
    blank=True, 
    default='media/avatars/default.png'
)

    speed = models.IntegerField(default=200)
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
    
    # === DANE PODSTAWOWE ===
    wpm = models.IntegerField(help_text="Słowa na minutę (obliczone z word_count / minuty)")
    accuracy = models.FloatField(help_text="Trafność w quizie (0-100)")
    completed_at = models.DateTimeField(auto_now_add=True)
    
    # === RANKING ===
    counted_for_ranking = models.BooleanField(default=False, help_text="Czy ten wynik liczy się do rankingu")
    attempt_number = models.IntegerField(default=1, help_text="Która to próba użytkownika dla tego ćwiczenia")
    ranking_points = models.IntegerField(default=0, help_text="Punkty rankingowe (0 jeśli accuracy < 60)")
    
    # === DODATKOWE ===
    completed_daily_challenge = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-completed_at']
    
    def calculate_ranking_points(self):
        """
        Oblicza BAZOWE punkty rankingowe.
        UWAGA: Zwraca 0 jeśli accuracy < 60%
        """
        if self.accuracy < 60:
            return 0
        
        word_count = self.exercise.word_count 
        
        # Mnożnik długości tekstu
        if word_count <= 300:
            length_multiplier = 0.8
        elif word_count <= 500:
            length_multiplier = 1.0
        elif word_count <= 800:
            length_multiplier = 1.2
        else:
            length_multiplier = 1.5
        
        points = self.wpm * (self.accuracy / 100) * length_multiplier
        return int(points)
    
    def can_resubmit_for_ranking(self):
        """Sprawdza czy użytkownik może ponownie wysłać wynik do rankingu (po 30 dniach)"""
        if not self.counted_for_ranking:
            return False 
        
        one_month_ago = timezone.now() - timedelta(days=30)
        return self.completed_at < one_month_ago
    
    def save(self, *args, **kwargs):
        """Główna logika zapisu"""
        old_ranked_attempt_to_deactivate = None
        
        if not self.pk:  
            old_ranked_attempt_to_deactivate = self._handle_ranking_eligibility()
            
            if self.counted_for_ranking:
                self._calculate_points_with_bonus()
            else:
                self.ranking_points = 0
                self.completed_daily_challenge = False
        
        super().save(*args, **kwargs)
        
        if old_ranked_attempt_to_deactivate:
            old_ranked_attempt_to_deactivate.counted_for_ranking = False
            old_ranked_attempt_to_deactivate.save()
            
        self._update_user_streak()

        if self.counted_for_ranking:
            self.update_user_stats()
            self._check_for_new_achievements()
        else:
            # Zapiszmy chociaż serię, nawet jeśli reszta statystyk się nie zmienia
            self.user.save()

    def _handle_ranking_eligibility(self):
        """Określa czy ta próba może liczyć się do rankingu"""
        previous_attempts = UserProgress.objects.filter(
            user=self.user, exercise=self.exercise
        )
        self.attempt_number = previous_attempts.count() + 1
        
        last_ranked_attempt = previous_attempts.filter(counted_for_ranking=True).first()
        
        if not last_ranked_attempt:
            self.counted_for_ranking = True
            return None
        
        if last_ranked_attempt.can_resubmit_for_ranking():
            self.counted_for_ranking = True
            return last_ranked_attempt 
        
        self.counted_for_ranking = False
        return None

    def _calculate_points_with_bonus(self):
        """Oblicza punkty z ewentualnym bonusem za daily challenge"""
        from .services import get_today_challenge
        base_points = self.calculate_ranking_points()

        if base_points == 0:
            self.ranking_points = 0
            self.completed_daily_challenge = False
            return

        today_challenge = get_today_challenge() 
        if today_challenge and self.exercise == today_challenge:
            self.ranking_points = base_points + 50  
            self.completed_daily_challenge = True
        else:
            self.ranking_points = base_points
            self.completed_daily_challenge = False
    
    def _update_user_streak(self):
        """Aktualizuje serię (streak) użytkownika"""
        user = self.user
        today = timezone.now().date()
        
        if user.last_streak_date == today:
            return

        if user.last_streak_date == (today - timedelta(days=1)):
            user.current_streak += 1
        else:
            user.current_streak = 1

        user.last_streak_date = today
        user.max_streak = max(user.current_streak, user.max_streak)

    def update_user_stats(self):
        """
        ⚠️ KLUCZOWA METODA - TU OBLICZAMY STATYSTYKI ⚠️
        
        Zasady:
        1. Liczymy TYLKO zaliczone próby: counted_for_ranking=True AND ranking_points > 0
        2. Średnie WPM i accuracy TYLKO z tych prób
        3. Suma wszystkich punktów rankingowych
        4. ranking_exercises_completed = liczba ZALICZONYCH prób (nie unikalne ćwiczenia!)
        """
        user = self.user
        
        # Pobierz tylko ZALICZONE próby (accuracy >= 60%, więc ranking_points > 0)
        successful_attempts = UserProgress.objects.filter(
            user=user,
            counted_for_ranking=True,
            ranking_points__gt=0  # To automatycznie filtruje accuracy >= 60%
        )
        
        stats = successful_attempts.aggregate(
            total_points=Sum('ranking_points'),
            count=Count('id'),
            avg_wpm=Avg('wpm'),
            avg_accuracy=Avg('accuracy')
        )
        
        if stats['count'] and stats['count'] > 0:
            user.total_ranking_points = stats['total_points'] or 0
            user.ranking_exercises_completed = stats['count']
            user.average_wpm = round(stats['avg_wpm'], 1)
            user.average_accuracy = round(stats['avg_accuracy'], 1)
        else:
            # Użytkownik nie ma żadnych zaliczonych prób
            user.total_ranking_points = 0
            user.ranking_exercises_completed = 0
            user.average_wpm = 0
            user.average_accuracy = 0
            
        user.save()

    def _check_for_new_achievements(self):
        """Sprawdza i przyznaje osiągnięcia"""
        user = self.user
        
        # Osiągnięcia za WPM (tylko z zaliczonych prób)
        if self.wpm >= 300:
            self.check_and_award_achievement(user, 'wpm_300')
            
        if self.wpm >= 800:
            self.check_and_award_achievement(user, 'wpm_800')

        # Osiągnięcia za perfekcyjną trafność
        if self.accuracy == 100:
            self.check_and_award_achievement(user, 'accuracy_100')
        
        # Osiągnięcia za długie teksty
        if self.exercise.word_count > 800:
            self.check_and_award_achievement(user, 'marathoner')
            
        # Osiągnięcia za daily challenge
        if self.completed_daily_challenge:
            self.check_and_award_achievement(user, 'daily_challenger')

    def check_and_award_achievement(self, user, achievement_slug):
        try:
            achievement_to_award = Achievement.objects.get(slug=achievement_slug)
            
            if not UserAchievement.objects.filter(user=user, achievement=achievement_to_award).exists():
                UserAchievement.objects.create(user=user, achievement=achievement_to_award)
                print(f"✅ Przyznano osiągnięcie '{achievement_slug}' użytkownikowi {user.username}")
                
        except Achievement.DoesNotExist:
            print(f"⚠️ OSTRZEŻENIE: Próba przyznania nieistniejącego osiągnięcia: {achievement_slug}")
        except Exception as e:
            print(f"❌ Błąd podczas przyznawania osiągnięcia: {e}")

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