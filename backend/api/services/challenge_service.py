from ..models import DailyChallenge, ReadingExercise
from django.utils import timezone
import random

def get_today_challenge():
    today = timezone.now().date()
    
    specific_challenge = DailyChallenge.objects.filter(date=today).first()
    if specific_challenge:
        return specific_challenge.exercise

    daily_entry, created = DailyChallenge.objects.get_or_create(date=today)
    
    if not created and daily_entry.exercise:
        return daily_entry.exercise

    pool = ReadingExercise.objects.filter(
        is_ranked=True, 
        is_daily_candidate=True
    )

    if not pool.exists():
        pool = ReadingExercise.objects.filter(is_ranked=True, is_public=True)

    if pool.exists():
        seed_val = int(today.strftime('%Y%m%d'))
        random.seed(seed_val)
        chosen_exercise = random.choice(list(pool))
        
        daily_entry.exercise = chosen_exercise
        daily_entry.save()
        
        return chosen_exercise
        
    return None