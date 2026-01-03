import traceback
from django.utils import timezone
from ..models import UserProgress, ReadingExercise
from . import ranking_logic, wpm_logic, streak_logic, achievement_logic, stats_logic
from .challenge_service import get_today_challenge

class SubmissionResult:
    def __init__(self, progress, new_achievements, new_wpm_limit):
        self.progress = progress
        self.new_achievements = new_achievements
        self.new_wpm_limit = new_wpm_limit

    def to_dict(self):
        return {
            "wpm": self.progress.wpm,
            "accuracy": self.progress.accuracy,
            "ranking_points": self.progress.ranking_points,
            "counted_for_ranking": self.progress.counted_for_ranking,
            "completed_daily_challenge": self.progress.completed_daily_challenge,
            "new_achievements": [a.title for a in self.new_achievements],
            "new_wpm_limit": self.new_wpm_limit
        }

def process_exercise_submission(user, exercise, reading_time_ms, accuracy):
    """
    Główna logika przetwarzania wyniku ćwiczenia.
    """
    try:
        minutes = reading_time_ms / 60000.0
        wpm = 0
        if minutes > 0.0001 and exercise.word_count > 0:
            wpm = int(exercise.word_count / minutes)
        
        today_challenge = get_today_challenge()
        is_daily_attempt = (today_challenge and today_challenge.id == exercise.id)
        daily_bonus_earned = False

        progress = UserProgress(
            user=user,
            exercise=exercise,
            wpm=wpm,
            accuracy=accuracy,
            completed_at=timezone.now()
        )

        old_attempt_to_deactivate = ranking_logic.determine_ranking_eligibility(progress)

        if is_daily_attempt:
            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            already_completed_with_success = UserProgress.objects.filter(
                user=user,
                exercise=exercise,
                completed_daily_challenge=True, 
                completed_at__gte=today_start
            ).exists()

            if not already_completed_with_success:
                progress.counted_for_ranking = True
                
                if accuracy >= 60:
                    progress.completed_daily_challenge = True
                    daily_bonus_earned = True
            else:
                progress.counted_for_ranking = False
                progress.completed_daily_challenge = False

        if progress.counted_for_ranking:
            ranking_logic.calculate_final_points(progress)
            
            if daily_bonus_earned:
                progress.ranking_points += 50 

        progress.save()

        if old_attempt_to_deactivate and not is_daily_attempt:
            old_attempt_to_deactivate.counted_for_ranking = False
            old_attempt_to_deactivate.save()

        streak_logic.update_user_streak(user)
        
        new_achievements = []
        new_wpm_limit = None

        if accuracy >= 60:
            if progress.counted_for_ranking or is_daily_attempt:
                 stats_logic.update_user_stats(user)

            new_achievements = achievement_logic.check_for_new_achievements(user, progress)
            
            new_wpm_limit = wpm_logic.check_and_update_wpm_milestone(user, progress)

        return SubmissionResult(progress, new_achievements, new_wpm_limit)

    except Exception as e:
        print("BŁĄD KRYTYCZNY W SUBMISSION SERVICE:")
        traceback.print_exc()
        raise e