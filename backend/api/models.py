from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone

class CustomUser(AbstractUser):
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
    
    # Statystyki rankingowe
    total_ranking_points = models.IntegerField(default=0)
    ranking_exercises_completed = models.IntegerField(default=0)
    average_wpm = models.FloatField(default=0)
    average_accuracy = models.FloatField(default=0)

class ReadingExercise(models.Model):
    title = models.CharField(max_length=100)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    favorited_by = models.ManyToManyField(
        CustomUser, 
        related_name='favorite_exercises', 
        blank=True
    )
    is_public = models.BooleanField(default=False)
    is_ranked = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    def __str__(self):
        return self.title
    
    def get_word_count(self):
        return len(self.text.split())
    
    def get_recommended_questions(self):
        """Zwraca zalecaną liczbę pytań na podstawie długości tekstu"""
        word_count = self.get_word_count()
        if word_count <= 300:
            return 3
        elif word_count <= 500:
            return 4
        elif word_count <= 800:
            return 5
        else:
            return 6

class Question(models.Model):
    QUESTION_TYPES = (
        ('open', 'Otwarte'),
        ('choice', 'Zamknięte (4 odpowiedzi)'),
    )
    
    exercise = models.ForeignKey(ReadingExercise, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(
        max_length=10,
        choices=QUESTION_TYPES,
        default='open'
    )
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
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    exercise = models.ForeignKey(ReadingExercise, on_delete=models.CASCADE)
    wpm = models.IntegerField()
    accuracy = models.FloatField()
    completed_at = models.DateTimeField(auto_now_add=True)
    
    # System rankingowy
    counted_for_ranking = models.BooleanField(default=False)
    attempt_number = models.IntegerField(default=1)
    ranking_points = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-completed_at']
    
    def calculate_ranking_points(self):
        """Oblicza punkty rankingowe na podstawie WPM, accuracy i długości tekstu"""
        if self.accuracy < 60:
            return 0
        
        word_count = self.exercise.get_word_count()
        
        # Mnożnik długości
        if word_count <= 300:
            length_multiplier = 0.8
        elif word_count <= 500:
            length_multiplier = 1.0
        elif word_count <= 800:
            length_multiplier = 1.2
        else:
            length_multiplier = 1.5
        
        # Wzór: WPM × (Accuracy/100) × Mnożnik_Długości
        points = self.wpm * (self.accuracy / 100) * length_multiplier
        return int(points)
    
    def can_resubmit_for_ranking(self):
        """Sprawdza czy użytkownik może ponownie wysłać wynik do rankingu (po miesiącu)"""
        if not self.counted_for_ranking:
            return False
        
        # Sprawdź czy minął miesiąc
        one_month_ago = timezone.now() - timedelta(days=30)
        return self.completed_at < one_month_ago
    
    def save(self, *args, **kwargs):
        # Sprawdź ile razy użytkownik próbował tego ćwiczenia
        if not self.pk:  # Tylko przy tworzeniu nowego rekordu
            previous_attempts = UserProgress.objects.filter(
                user=self.user,
                exercise=self.exercise
            ).count()
            
            self.attempt_number = previous_attempts + 1
            
            # Sprawdź czy to pierwsze podejście LUB czy można zresetować (po miesiącu)
            if previous_attempts == 0:
                self.counted_for_ranking = True
            else:
                # Sprawdź czy ostatnia próba była ponad miesiąc temu
                last_ranked_attempt = UserProgress.objects.filter(
                    user=self.user,
                    exercise=self.exercise,
                    counted_for_ranking=True
                ).first()
                
                if last_ranked_attempt and last_ranked_attempt.can_resubmit_for_ranking():
                    # Dezaktywuj poprzednią próbę rankingową
                    last_ranked_attempt.counted_for_ranking = False
                    last_ranked_attempt.save()
                    # Ta próba będzie liczyć się do rankingu
                    self.counted_for_ranking = True
                else:
                    self.counted_for_ranking = False
            
            # Oblicz punkty tylko jeśli liczy się do rankingu
            if self.counted_for_ranking:
                self.ranking_points = self.calculate_ranking_points()
            else:
                self.ranking_points = 0
        
        super().save(*args, **kwargs)
        
        # Aktualizuj statystyki użytkownika
        if self.counted_for_ranking:
            self.update_user_stats()
    
    def update_user_stats(self):
        """Aktualizuje statystyki rankingowe użytkownika"""
        user = self.user
        
        # Pobierz wszystkie wyniki rankingowe użytkownika
        ranking_results = UserProgress.objects.filter(
            user=user,
            counted_for_ranking=True
        )
        
        if ranking_results.exists():
            user.total_ranking_points = sum(r.ranking_points for r in ranking_results)
            user.ranking_exercises_completed = ranking_results.count()
            user.average_wpm = sum(r.wpm for r in ranking_results) / ranking_results.count()
            user.average_accuracy = sum(r.accuracy for r in ranking_results) / ranking_results.count()
            user.save()