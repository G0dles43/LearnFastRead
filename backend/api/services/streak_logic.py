from django.utils import timezone
from datetime import timedelta
from ..models import CustomUser

def update_user_streak(user: CustomUser):
    """Aktualizuje serię (streak) użytkownika"""
    today = timezone.now().date()
    
    if user.last_streak_date == today:
        return 

    if user.last_streak_date == (today - timedelta(days=1)):
        user.current_streak += 1
    else:
        user.current_streak = 1 

    user.last_streak_date = today
    user.max_streak = max(user.current_streak, user.max_streak)
    