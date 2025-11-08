# api/services/submission_service.py
from ..models import UserProgress, CustomUser, ReadingExercise, Notification
from . import ranking_logic, streak_logic, stats_logic, achievement_logic, wpm_logic
from django.db import transaction

# Stwórz klasę do zwracania wyniku, będzie czyściej
class SubmissionResult:
    def __init__(self, progress: UserProgress, new_achievements=None, new_wpm_limit=None):
        self.progress = progress
        self.new_achievements = new_achievements or []
        self.new_wpm_limit = new_wpm_limit
    
    def to_dict(self):
        # To zwrócimy w Response
        return {
            'wpm': self.progress.wpm,
            'accuracy': self.progress.accuracy,
            'ranking_points': self.progress.ranking_points,
            'counted_for_ranking': self.progress.counted_for_ranking,
            'attempt_number': self.progress.attempt_number,
            'new_wpm_limit': self.new_wpm_limit,
            'new_achievements_count': len(self.new_achievements)
        }

@transaction.atomic
def process_exercise_submission(user: CustomUser, exercise: ReadingExercise, wpm: int, accuracy: float) -> SubmissionResult:
    """
    Główna funkcja biznesowa do obsługi wyniku ćwiczenia.
    Zastępuje całą logikę z UserProgress.save().
    """
    
    # 1. Stwórz "głupi" obiekt
    progress = UserProgress(
        user=user,
        exercise=exercise,
        wpm=wpm,
        accuracy=accuracy
    )
    
    # 2. Użyj serwisów, aby USTAWIAĆ dane na obiekcie (bez zapisu)
    old_ranked_attempt = ranking_logic.determine_ranking_eligibility(progress)
    ranking_logic.calculate_final_points(progress)
    
    # 3. ZAPISZ postęp (tylko raz!)
    progress.save()
    
    # 4. Deaktywuj starą próbę, jeśli trzeba
    if old_ranked_attempt:
        old_ranked_attempt.counted_for_ranking = False
        old_ranked_attempt.save(update_fields=['counted_for_ranking'])
        
    # 5. Uruchom logikę, która potrzebuje zapisanego obiektu 'progress'
    # i AKTUALIZUJE samego użytkownika
    
    # Aktualizuj streak (dane są na obiekcie 'user')
    streak_logic.update_user_streak(user) 
    
    # Sprawdź WPM (dane są na 'user' i 'progress')
    new_wpm_limit = wpm_logic.check_and_update_wpm_milestone(user, progress)
    
    # Sprawdź osiągnięcia (dane są na 'user' i 'progress')
    new_achievements = achievement_logic.check_for_new_achievements(user, progress)
    
    # 6. Na samym końcu przelicz statystyki i ZAPISZ użytkownika
    # Ta funkcja musi być ostatnia i sama robi .save() na userze
    if progress.counted_for_ranking:
        stats_logic.update_user_stats(user)
    else:
        # Zapisz tylko zmiany ze streaka (jeśli nie było liczone do rankingu)
        user.save(update_fields=['current_streak', 'max_streak', 'last_streak_date'])

    # 7. Zwróć wynik
    return SubmissionResult(progress, new_achievements, new_wpm_limit)