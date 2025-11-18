from ..models import UserProgress, CustomUser, ReadingExercise, Notification
from . import ranking_logic, streak_logic, stats_logic, achievement_logic, wpm_logic
from django.db import transaction

class SubmissionResult:
    def __init__(self, progress: UserProgress, new_achievements=None, new_wpm_limit=None):
        self.progress = progress
        self.new_achievements = new_achievements or []
        self.new_wpm_limit = new_wpm_limit
    
    def to_dict(self):
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
def process_exercise_submission(user: CustomUser, exercise: ReadingExercise, reading_time_ms: int, accuracy: float) -> SubmissionResult:
    """
    POPRAWKA: Używamy reading_time_ms bezpośrednio do obliczenia WPM
    """
    
    # Oblicz WPM na podstawie FAKTYCZNEGO czasu czytania
    minutes = reading_time_ms / 60000.0
    if minutes == 0:
        wpm = 0
    else:
        wpm = round(exercise.word_count / minutes)
    
    # Stwórz obiekt z POPRAWNYM WPM
    progress = UserProgress(
        user=user,
        exercise=exercise,
        wpm=wpm,  # To jest teraz FAKTYCZNE WPM
        accuracy=accuracy
    )
    
    # Określ eligibility
    old_ranked_attempt = ranking_logic.determine_ranking_eligibility(progress)
    ranking_logic.calculate_final_points(progress)
    
    # Zapisz
    progress.save()
    
    # Deaktywuj starą próbę
    if old_ranked_attempt:
        old_ranked_attempt.counted_for_ranking = False
        old_ranked_attempt.save(update_fields=['counted_for_ranking'])
        
    # Streak
    streak_logic.update_user_streak(user) 
    
    # WPM milestone
    new_wpm_limit = wpm_logic.check_and_update_wpm_milestone(user, progress)
    
    # Achievements
    new_achievements = achievement_logic.check_for_new_achievements(user, progress)
    
    # Stats
    if progress.counted_for_ranking:
        stats_logic.update_user_stats(user)
    else:
        user.save(update_fields=['current_streak', 'max_streak', 'last_streak_date'])

    return SubmissionResult(progress, new_achievements, new_wpm_limit)