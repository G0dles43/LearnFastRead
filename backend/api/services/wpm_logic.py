import logging
from ..models import CustomUser, UserProgress, Notification
from ..wpm_milestones import MIN_PASS_ACCURACY, get_next_wpm_limit

# Używamy loggingu zamiast print()
logger = logging.getLogger(__name__)

def check_and_update_wpm_milestone(user: CustomUser, progress: UserProgress) -> int | None:
    """
    Sprawdza, czy użytkownik kwalifikuje się do odblokowania nowego limitu WPM.
    Jeśli tak, aktualizuje użytkownika, zapisuje go i tworzy powiadomienie.
    
    Zwraca nowy limit (int) jeśli został odblokowany, lub None.
    """
    
    # Warunki, które przerywają sprawdzanie
    if progress.accuracy < MIN_PASS_ACCURACY:
        return None  # Niewystarczająca trafność

    if not progress.exercise.is_ranked:
        return None  # To nie było ćwiczenie rankingowe

    if progress.wpm < user.max_wpm_limit:
        return None # Wynik WPM jest niższy niż aktualny limit

    # Użytkownik kwalifikuje się - sprawdź, jaki jest następny próg
    new_limit = get_next_wpm_limit(user.max_wpm_limit)

    if new_limit > user.max_wpm_limit:
        old_limit = user.max_wpm_limit
        user.max_wpm_limit = new_limit
        
        # Zapisujemy tylko tę jedną zmianę u użytkownika
        user.save(update_fields=['max_wpm_limit'])
        
        # Tworzymy powiadomienie
        try:
            Notification.objects.create(
                recipient=user,
                actor=user,
                verb=f"odblokował nowy limit prędkości: {new_limit} WPM! Gratulacje!",
            )
            logger.info(f"Użytkownik {user.username} odblokował {new_limit} WPM (z {old_limit} WPM)")
        except Exception as e:
            logger.error(f"Błąd tworzenia powiadomienia o WPM dla {user.username}: {e}")
            
        return new_limit # Zwróć nowy limit

    return None # Nie odblokowano nowego limitu