WPM_MILESTONES = {
    350: 500,
    500: 700,
    700: 900,
    900: 1200,
    1200: 1500,
    1500: 1500 
}

DEFAULT_WPM_LIMIT = 350

MIN_PASS_ACCURACY = 60

def get_next_wpm_limit(current_limit):
    """
    Zwraca kolejny próg WPM na podstawie aktualnego limitu.
    """
    return WPM_MILESTONES.get(current_limit, current_limit)