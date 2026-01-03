from ..models import DailyChallenge, ReadingExercise
from django.utils import timezone
from django.db.models import Q
import random
import logging

logger = logging.getLogger(__name__)

def get_today_challenge():
    """
    1. Czyści stare wyzwania (z wczoraj i starsze).
    2. Sprawdza/Tworzy wyzwanie na dziś.
    """
    today = timezone.now().date()

    deleted_count, _ = DailyChallenge.objects.filter(date__lt=today).delete()
    if deleted_count > 0:
        logger.info(f"Wyczyszczono {deleted_count} starych wyzwań daily.")

    
    """
    expired_exercises = ReadingExercise.objects.filter(scheduled_date__lt=today)
    for ex in expired_exercises:
        ex.scheduled_date = None
        ex.is_daily_candidate = False # Przestań traktować jako kandydata, bo termin minął
        ex.save()
        logger.warning(f"Zresetowano przeterminowane ćwiczenie: {ex.title}")
    """

    
    try:
        daily_entry = DailyChallenge.objects.select_related('exercise').get(date=today)
        return daily_entry.exercise
    except DailyChallenge.DoesNotExist:
        pass 

    
    pool = list(ReadingExercise.objects.filter(
        is_ranked=True, 
        is_daily_candidate=True
    ))

    
    priority_exercise = None
    if hasattr(ReadingExercise, 'scheduled_date'):
         priority_exercise = ReadingExercise.objects.filter(
             is_ranked=True, 
             scheduled_date=today
         ).first()

    chosen_exercise = priority_exercise

    if not chosen_exercise and pool:
        valid_pool = []
        for ex in pool:
            if hasattr(ex, 'scheduled_date') and ex.scheduled_date and ex.scheduled_date > today:
                continue
            valid_pool.append(ex)
            
        if valid_pool:
            chosen_exercise = random.choice(valid_pool)
            
            chosen_exercise.is_daily_candidate = False
            if hasattr(chosen_exercise, 'scheduled_date'):
                chosen_exercise.scheduled_date = None
            chosen_exercise.save()
            
            logger.info(f"Wylosowano wyzwanie: {chosen_exercise.title}")

    if not chosen_exercise:
        fallback_pool = list(ReadingExercise.objects.filter(is_ranked=True, is_public=True))
        if fallback_pool:
            seed_val = int(today.strftime('%Y%m%d'))
            random.seed(seed_val)
            chosen_exercise = random.choice(fallback_pool)

    if chosen_exercise:
        DailyChallenge.objects.create(date=today, exercise=chosen_exercise)
        return chosen_exercise
        
    return None