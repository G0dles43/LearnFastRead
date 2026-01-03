import logging
from ..models import CustomUser, UserProgress, Achievement, UserAchievement

logger = logging.getLogger(__name__)

def _award_achievement(user: CustomUser, achievement_slug: str) -> Achievement | None:
    """
    Wewnętrzna funkcja pomocnicza.
    Próbuje przyznać użytkownikowi osiągnięcie.
    """
    try:
        achievement_to_award = Achievement.objects.get(slug=achievement_slug)
        
        obj, created = UserAchievement.objects.get_or_create(
            user=user, 
            achievement=achievement_to_award
        )

        if created:
            logger.info(f"Przyznano osiągnięcie '{achievement_slug}' użytkownikowi {user.username}")
            return achievement_to_award 
        
        return None
        
    except Achievement.DoesNotExist:
        logger.warning(f"OSTRZEŻENIE: Próba przyznania nieistniejącego osiągnięcia (slug): {achievement_slug}")
        return None
    except Exception as e:
        logger.error(f"Błąd podczas przyznawania osiągnięcia '{achievement_slug}' dla {user.username}: {e}")
        return None

def check_for_new_achievements(user: CustomUser, progress: UserProgress) -> list[Achievement]:
    """
    Sprawdza i przyznaje osiągnięcia na podstawie zakończonego ćwiczenia.
    Zwraca listę nowo przyznanych osiągnięć.
    UWAGA: Ta funkcja jest wywoływana tylko, gdy accuracy >= 60%.
    """
    newly_awarded = []
    
    if progress.accuracy < 60:
        return newly_awarded
    
    if progress.wpm >= 300:
        if new_ach := _award_achievement(user, 'wpm_300'):
            newly_awarded.append(new_ach)
            
    if progress.wpm >= 800:
        if new_ach := _award_achievement(user, 'wpm_800'):
            newly_awarded.append(new_ach)

    if progress.accuracy == 100:
        if new_ach := _award_achievement(user, 'accuracy_100'):
            newly_awarded.append(new_ach)
    
    if progress.exercise.word_count > 800:
        if new_ach := _award_achievement(user, 'marathoner'):
            newly_awarded.append(new_ach)
            
    if progress.completed_daily_challenge:
        if new_ach := _award_achievement(user, 'daily_challenger'):
            newly_awarded.append(new_ach)

    return newly_awarded