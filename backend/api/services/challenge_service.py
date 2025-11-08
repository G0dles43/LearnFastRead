import logging
from django.utils import timezone
from ..models import ReadingExercise

logger = logging.getLogger(__name__)

def get_today_challenge() -> ReadingExercise | None:
    """
    Wybiera jedno ćwiczenie jako "Wyzwanie Dnia" na podstawie
    algorytmu (dzień roku % liczba ćwiczeń).
    
    Zwraca obiekt ReadingExercise lub None.
    """
    eligible_exercises = ReadingExercise.objects.filter(
        is_public=True,
        is_ranked=True
    ).order_by('id') # Ważne jest stałe sortowanie!
    
    count = eligible_exercises.count()
    
    if count == 0:
        # Sytuacja awaryjna: nie ma żadnych publicznych, rankingowych ćwiczeń.
        # Spróbujmy znaleźć JAKIEKOLWIEK rankingowe.
        any_ranked = ReadingExercise.objects.filter(is_ranked=True).order_by('id').first()
        if not any_ranked:
            logger.error("CRITICAL: Brak jakichkolwiek ćwiczeń rankingowych w systemie. Wyzwanie Dnia nie działa.")
            return None
        
        logger.warning(f"Brak publicznych ćwiczeń rankingowych. Wyzwanie Dnia używa awaryjnie ID: {any_ranked.id}")
        return any_ranked # Lepsze to niż nic

    # Algorytm wyboru
    day_of_year = timezone.now().timetuple().tm_yday
    challenge_index = day_of_year % count
    
    return eligible_exercises[challenge_index]