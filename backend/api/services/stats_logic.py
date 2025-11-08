# api/services/stats_logic.py
from ..models import CustomUser, UserProgress
from django.db.models import Sum, Avg, Count

def update_user_stats(user: CustomUser):
    """ Przelicza i ZAPISUJE statystyki użytkownika """
    
    successful_attempts = UserProgress.objects.filter(
        user=user,
        counted_for_ranking=True,
        ranking_points__gt=0 
    )
    
    stats = successful_attempts.aggregate(
        total_points=Sum('ranking_points'),
        count=Count('id'),
        avg_wpm=Avg('wpm'),
        avg_accuracy=Avg('accuracy')
    )
    
    fields_to_update = ['current_streak', 'max_streak', 'last_streak_date']

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
        
    fields_to_update.extend([
        'total_ranking_points', 'ranking_exercises_completed', 
        'average_wpm', 'average_accuracy'
    ])
        
    user.save(update_fields=fields_to_update)