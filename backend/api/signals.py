from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Friendship, UserAchievement, Notification, CustomUser, UserProgress
from django.db.models import F, Window
from django.db.models.functions import Rank

print("Plik signals.py został zaimportowany!")

@receiver(post_save, sender=Friendship)
def create_follow_notification(sender, instance, created, **kwargs):
    print(f"[SIGNAL] Friendship post_save - created={created}")
    
    if created:
        try:
            user_content_type = ContentType.objects.get_for_model(CustomUser)
            
            Notification.objects.create(
                recipient=instance.followed,
                actor=instance.follower,
                verb="zaczyna Cię obserwować",
                content_type=user_content_type,
                object_id=instance.follower.id
            )
            
            print(f"[SIGNAL] Powiadomienie follow utworzone!")
            
        except Exception as e:
            print(f"[SIGNAL ERROR] {e}")

@receiver(pre_delete, sender=Friendship)
def create_unfollow_notification(sender, instance, **kwargs):
    """Powiadomienie gdy ktoś przestaje obserwować"""
    print(f"[SIGNAL] Friendship pre_delete")
    
    try:
        user_content_type = ContentType.objects.get_for_model(CustomUser)
        
        Notification.objects.create(
            recipient=instance.followed,
            actor=instance.follower,
            verb="przestał Cię obserwować",
            content_type=user_content_type,
            object_id=instance.follower.id
        )
        
        print(f"[SIGNAL] Powiadomienie unfollow utworzone!")
        
    except Exception as e:
        print(f"[SIGNAL ERROR] {e}")

@receiver(post_save, sender=UserAchievement)
def create_achievement_notification(sender, instance, created, **kwargs):
    print(f"[SIGNAL] UserAchievement post_save - created={created}")
    
    if created:
        try:
            achievement_content_type = ContentType.objects.get_for_model(instance.achievement.__class__)
            
            Notification.objects.create(
                recipient=instance.user,
                actor=instance.user,
                verb=f"odblokował osiągnięcie: {instance.achievement.title}",
                content_type=achievement_content_type,
                object_id=instance.achievement.pk
            )
            
            print(f"[SIGNAL] Achievement notification utworzone!")
            
        except Exception as e:
            print(f"[SIGNAL ERROR] {e}")


@receiver(post_save, sender=CustomUser)
def check_ranking_overtake(sender, instance, created, **kwargs):
    """
    Powiadomienie gdy ktoś przebija Cię w TOP 10 rankingu.
    Odpala się PO zapisaniu CustomUser.
    """
    
    update_fields = kwargs.get('update_fields', None)

    if not update_fields or 'total_ranking_points' not in update_fields:
        return

    active_user = instance
    if created or active_user.total_ranking_points == 0:
        return

    print(f"SIGNAL] Punkty {active_user.username} zaktualizowane. Sprawdzam TOP 10...")

    try:
        top_users_qs = CustomUser.objects.annotate(
            rank=Window(
                expression=Rank(),
                order_by=F('total_ranking_points').desc()
            )
        ).filter(
            total_ranking_points__gt=0,
            rank__lte=10
        ).order_by('rank')

        top_users_map = {user.id: user for user in top_users_qs}
        
        if active_user.id in top_users_map:
            user_content_type = ContentType.objects.get_for_model(CustomUser)
            
            for other_user_id, other_user in top_users_map.items():
                if other_user_id == active_user.id:
                    continue
                    
                if active_user.total_ranking_points > other_user.total_ranking_points:
                    Notification.objects.create(
                        recipient=other_user,
                        actor=active_user,
                        verb=f"awansował w rankingu TOP 10! ({active_user.total_ranking_points} pkt)",
                        content_type=user_content_type,
                        object_id=active_user.id
                    )
                    print(f"[SIGNAL] Powiadomiono {other_user.username} o awansie {active_user.username}")
            
            print(f"[SIGNAL] {active_user.username} jest w TOP 10!")
        
    except Exception as e:
        print(f"[SIGNAL ERROR ranking] {e}")


print("Sygnały zarejestrowane!")