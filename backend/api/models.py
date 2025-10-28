from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Avg, Count

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

    word_count = models.IntegerField(default=0, editable=False, help_text="Automatycznie liczona liczba słów")
    
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
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="progress_records")
    exercise = models.ForeignKey(ReadingExercise, on_delete=models.CASCADE, related_name="progress_records")
    wpm = models.IntegerField()
    accuracy = models.FloatField()
    completed_at = models.DateTimeField(auto_now_add=True)
    
    # System rankingowy
    counted_for_ranking = models.BooleanField(default=False)
    attempt_number = models.IntegerField(default=1)
    ranking_points = models.IntegerField(default=0)
    
    # Funkcja 2: Wyzwania Dnia
    completed_daily_challenge = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-completed_at']
    
    def calculate_ranking_points(self):
        from .services import get_today_challenge
        """Oblicza BAZOWE punkty rankingowe na podstawie WPM, accuracy i długości tekstu"""
        if self.accuracy < 60:
            return 0
        
        word_count = self.exercise.get_word_count()
        
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
            return False # To nie był wynik rankingowy, więc nie ma "cooldownu"
        
        one_month_ago = timezone.now() - timedelta(days=30)
        return self.completed_at < one_month_ago
    
    def save(self, *args, **kwargs):
        """
        Główna logika zapisu: ustala ranking, oblicza punkty, zapisuje,
        a następnie aktualizuje statystyki i sprawdza osiągnięcia.
        """
        old_ranked_attempt_to_deactivate = None
        
        if not self.pk:  # Logika uruchamiana tylko przy tworzeniu nowego rekordu
            # 1. Ustal numer próby i czy liczy się do rankingu
            old_ranked_attempt_to_deactivate = self._handle_ranking_eligibility()
            
            # 2. Oblicz punkty (w tym bonusy), jeśli to próba rankingowa
            if self.counted_for_ranking:
                self._calculate_points_with_bonus()
            else:
                self.ranking_points = 0
                self.completed_daily_challenge = False
        
        # 3. Zapisz ten nowy rekord UserProgress w bazie
        super().save(*args, **kwargs)
        
        # 4. Jeśli był stary rekord do deaktywacji, zrób to teraz
        #    (Robimy to po 'super().save()', aby uniknąć problemów)
        if old_ranked_attempt_to_deactivate:
            old_ranked_attempt_to_deactivate.counted_for_ranking = False
            old_ranked_attempt_to_deactivate.save()
            
        # 5. Zaktualizuj statystyki na profilu usera i sprawdź odznaki
        if self.counted_for_ranking:
            self.update_user_stats()
            self._check_for_new_achievements()

    def _handle_ranking_eligibility(self):
        """
        Metoda pomocnicza: Ustawia self.attempt_number i self.counted_for_ranking.
        Zwraca stary rekord rankingowy, jeśli trzeba go deaktywować.
        """
        previous_attempts = UserProgress.objects.filter(
            user=self.user, exercise=self.exercise
        )
        self.attempt_number = previous_attempts.count() + 1
        
        last_ranked_attempt = previous_attempts.filter(counted_for_ranking=True).first()
        
        if not last_ranked_attempt:
            # To jest pierwsza próba rankingowa dla tego ćwiczenia.
            self.counted_for_ranking = True
            return None
        
        if last_ranked_attempt.can_resubmit_for_ranking():
            # Minęło 30 dni, ta próba jest nową próbą rankingową.
            self.counted_for_ranking = True
            return last_ranked_attempt # Zwróć stary rekord do deaktywacji
        
        # Nie minęło 30 dni. To jest tylko próba treningowa.
        self.counted_for_ranking = False
        return None

    def _calculate_points_with_bonus(self):
        """
        Metoda pomocnicza: Oblicza i ustawia self.ranking_points
        oraz self.completed_daily_challenge.
        """
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

    def update_user_stats(self):
        """
        Aktualizuje zagregowane statystyki na modelu CustomUser.
        Średnie liczone są tylko z prób, w których zdobyto punkty.
        Używa aggregate() dla lepszej wydajności.
        """
        user = self.user
        
        ranking_results = UserProgress.objects.filter(
            user=user,
            counted_for_ranking=True,
            ranking_points__gt=0  
        )
        
        stats = ranking_results.aggregate(
            total_points=Sum('ranking_points'), 
            count=Count('id'),                 
            total_wpm=Sum('wpm'),              
            total_accuracy=Sum('accuracy')    
        )
        
        total_ranked_attempts_count = UserProgress.objects.filter(
            user=user,
            counted_for_ranking=True
        ).count()
        
        if stats['count'] and stats['count'] > 0:
            user.total_ranking_points = stats['total_points'] if stats['total_points'] is not None else 0
            user.ranking_exercises_completed = total_ranked_attempts_count 
            user.average_wpm = stats['total_wpm'] / stats['count']
            user.average_accuracy = stats['total_accuracy'] / stats['count']
        else:
            user.total_ranking_points = 0
            user.ranking_exercises_completed = total_ranked_attempts_count 
            user.average_wpm = 0
            user.average_accuracy = 0
            
        user.save()

    def _check_for_new_achievements(self):
        """
        Sprawdza wszystkie warunki do przyznania odznak na podstawie
        tego konkretnego (self) wyniku.
        """
        user = self.user
        
        # 1. Osiągnięcie: "Amator Prędkości" (300 WPM)
        if self.wpm >= 300:
            self.check_and_award_achievement(user, 'wpm_300')
            
        # 2. Osiągnięcie: "Demon Prędkości" (800 WPM)
        if self.wpm >= 800:
            self.check_and_award_achievement(user, 'wpm_800')

        # 3. Osiągnięcie: "Perfekcjonista" (100% trafności)
        if self.accuracy == 100:
            self.check_and_award_achievement(user, 'accuracy_100')
        
        # 4. Osiągnięcie: "Maratończyk" (tekst > 800 słów)
        if self.exercise.get_word_count() > 800:
            self.check_and_award_achievement(user, 'marathoner')
            
        # 5. NOWE Osiągnięcie: "Wojownik Dnia" (za ukończenie wyzwania)
        if self.completed_daily_challenge:
            self.check_and_award_achievement(user, 'daily_challenger')

    def check_and_award_achievement(self, user, achievement_slug):
        """
        Metoda pomocnicza: Bezpiecznie przyznaje osiągnięcie,
        jeśli użytkownik jeszcze go nie ma.
        """
        try:
            achievement_to_award = Achievement.objects.get(slug=achievement_slug)
            
            if not UserAchievement.objects.filter(user=user, achievement=achievement_to_award).exists():
                UserAchievement.objects.create(user=user, achievement=achievement_to_award)
                print(f"Przyznano osiągnięcie '{achievement_slug}' użytkownikowi {user.username}")
                
        except Achievement.DoesNotExist:
            print(f"OSTRZEŻENIE: Próba przyznania nieistniejącego osiągnięcia: {achievement_slug}")
        except Exception as e:
            print(f"Błąd podczas przyznawania osiągnięcia: {e}")

class Achievement(models.Model):
    slug = models.CharField(max_length=100, unique=True, primary_key=True, help_text="Unikalny identyfikator, np. 'wpm_500'")
    title = models.CharField(max_length=100)
    description = models.TextField(help_text="Opis, który zobaczy użytkownik, np. 'Osiągnij 500 Słów na Minutę'")
    icon_name = models.CharField(max_length=50, default="🏆", help_text="Emoji lub nazwa ikony (np. z FontAwesome)")

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