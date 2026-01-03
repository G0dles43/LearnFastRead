from ..models import CustomUser, UserProgress
from django.db.models import Sum, Avg, Count

def update_user_stats(user: CustomUser):
    """ 
    Przelicza i ZAPISUJE statystyki użytkownika.
    Bierze pod uwagę TYLKO zaliczone próby (accuracy >= 60%).
    """
    
    successful_attempts = UserProgress.objects.filter(
        user=user,
        exercise__is_ranked=True, 
        accuracy__gte=60          
    )
    
    stats = successful_attempts.aggregate(
        total_points=Sum('ranking_points'),
        count=Count('id'),
        avg_wpm=Avg('wpm'),
        avg_accuracy=Avg('accuracy')
    )
    
    fields_to_update = [
        'total_ranking_points', 
        'ranking_exercises_completed', 
        'average_wpm', 
        'average_accuracy'
    ]

    if stats['count'] and stats['count'] > 0:
        user.total_ranking_points = stats['total_points'] or 0
        user.ranking_exercises_completed = stats['count']
        user.average_wpm = round(stats['avg_wpm'], 1)
        user.average_accuracy = round(stats['avg_accuracy'], 1)
    else:
        user.total_ranking_points = 0
        user.ranking_exercises_completed = 0
        user.average_wpm = 0
        user.average_accuracy = 0
        
    user.save(update_fields=fields_to_update)