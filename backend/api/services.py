from django.utils import timezone
from .models import ReadingExercise

def get_today_challenge():
    """
    Wybiera jedno ćwiczenie jako "Wyzwanie Dnia" na podstawie
    algorytmu (dzień roku % liczba ćwiczeń).
    
    Zwraca obiekt ReadingExercise lub None.
    """
    try:
        return ReadingExercise.objects.get(id=36) 
    except ReadingExercise.DoesNotExist:
        return None 
    # eligible_exercises = ReadingExercise.objects.filter(
    #     is_public=True,
    #     is_ranked=True
    # ).order_by('id') 
    
    # count = eligible_exercises.count()
    
    # if count == 0:
    #     return None
        
    # day_of_year = timezone.now().timetuple().tm_yday
    
    # challenge_index = day_of_year % count
    
    # return eligible_exercises[challenge_index]