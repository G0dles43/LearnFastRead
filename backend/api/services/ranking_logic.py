# api/services/ranking_logic.py
from django.utils import timezone
from datetime import timedelta
from ..models import UserProgress
from ..services.challenge_service import get_today_challenge # Zamiast importować z services w modelu

# Wytnij i wklej z modelu UserProgress
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

# Wytnij i wklej z modelu UserProgress
def _can_resubmit_for_ranking(last_ranked_attempt: UserProgress) -> bool:
    """Sprawdza czy użytkownik może ponownie wysłać wynik do rankingu (po 30 dniach)"""
    if not last_ranked_attempt:
        return True
    
    one_month_ago = timezone.now() - timedelta(days=30)
    return last_ranked_attempt.completed_at < one_month_ago

# Ta funkcja zastępuje _handle_ranking_eligibility
def determine_ranking_eligibility(progress: UserProgress):
    """
    Określa czy ta próba może liczyć się do rankingu.
    Ustawia pola na obiekcie 'progress' (ale go nie zapisuje!).
    """
    previous_attempts = UserProgress.objects.filter(
        user=progress.user, exercise=progress.exercise
    )
    progress.attempt_number = previous_attempts.count() + 1
    
    last_ranked_attempt = previous_attempts.filter(counted_for_ranking=True).first()
    
    if not last_ranked_attempt:
        progress.counted_for_ranking = True
        return None # Nie ma starej próby do deaktywacji
    
    if _can_resubmit_for_ranking(last_ranked_attempt):
        progress.counted_for_ranking = True
        return last_ranked_attempt # Zwraca starą próbę do deaktywacji
    
    progress.counted_for_ranking = False
    return None

# Ta funkcja zastępuje _calculate_points_with_bonus
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