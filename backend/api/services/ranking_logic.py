from django.utils import timezone
from datetime import timedelta
from ..models import UserProgress, DailyChallenge
from ..services.challenge_service import get_today_challenge 

def _calculate_base_ranking_points(progress: UserProgress) -> int:
    """ Oblicza BAZOWE punkty rankingowe. """
    if progress.accuracy < 60:
        return 0
    
    word_count = progress.exercise.word_count 
    
    if word_count <= 300:
        length_multiplier = 0.8
    elif word_count <= 500:
        length_multiplier = 1.0
    elif word_count <= 800:
        length_multiplier = 1.2
    else:
        length_multiplier = 1.5
    
    points = progress.wpm * (progress.accuracy / 100) * length_multiplier
    return int(points)

def _can_resubmit_for_ranking(last_ranked_attempt: UserProgress) -> bool:
    """Sprawdza czy użytkownik może ponownie wysłać wynik do rankingu (po 30 dniach)"""
    if not last_ranked_attempt:
        return True
    
    one_month_ago = timezone.now() - timedelta(days=30)
    return last_ranked_attempt.completed_at < one_month_ago

def determine_ranking_eligibility(progress: UserProgress):
    user = progress.user
    exercise = progress.exercise

    today = timezone.now().date()
    today_challenge = DailyChallenge.objects.filter(date=today).first()
    
    is_today_challenge = (today_challenge and today_challenge.exercise.id == exercise.id)

    if is_today_challenge:
        already_completed_today = UserProgress.objects.filter(
            user=user,
            exercise=exercise,
            completed_daily_challenge=True,
            completed_at__date=today
        ).exists()

        if not already_completed_today:
            progress.counted_for_ranking = True
            progress.completed_daily_challenge = True
            return None 

    one_month_ago = timezone.now() - timedelta(days=30)
    
    last_ranked = UserProgress.objects.filter(
        user=user,
        exercise=exercise,
        counted_for_ranking=True
    ).order_by('-completed_at').first()

    if last_ranked:
        if last_ranked.completed_at >= one_month_ago:
            progress.counted_for_ranking = False
            return None
        else:
            progress.counted_for_ranking = True
            return last_ranked
    else:
        progress.counted_for_ranking = True
        return None

def calculate_final_points(progress: UserProgress):
    """
    Oblicza punkty z ewentualnym bonusem za daily challenge.
    Ustawia pola na obiekcie 'progress' (ale go nie zapisuje!).
    """
    if not progress.counted_for_ranking:
        progress.ranking_points = 0
        progress.completed_daily_challenge = False
        return

    base_points = _calculate_base_ranking_points(progress)

    if base_points == 0:
        progress.ranking_points = 0
        progress.completed_daily_challenge = False
        return

    today_challenge = get_today_challenge() 
    if today_challenge and progress.exercise == today_challenge:
        progress.ranking_points = base_points + 50  
        progress.completed_daily_challenge = True
    else:
        progress.ranking_points = base_points
        progress.completed_daily_challenge = False