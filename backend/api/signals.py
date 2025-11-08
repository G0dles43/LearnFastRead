from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Friendship, UserAchievement, Notification, CustomUser, UserProgress

print("📢 Plik signals.py został zaimportowany!")

# === OBSERWOWANIE ===
@receiver(post_save, sender=Friendship)
def create_follow_notification(sender, instance, created, **kwargs):
    print(f"🔔 [SIGNAL] Friendship post_save - created={created}")
    
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
            
            print(f"✅ [SIGNAL] Powiadomienie follow utworzone!")
            
        except Exception as e:
            print(f"❌ [SIGNAL ERROR] {e}")

# === ZAPRZESTANIE OBSERWOWANIA (NOWE!) ===
@receiver(pre_delete, sender=Friendship)
def create_unfollow_notification(sender, instance, **kwargs):
    """Powiadomienie gdy ktoś przestaje obserwować"""
    print(f"🔴 [SIGNAL] Friendship pre_delete")
    
    try:
        user_content_type = ContentType.objects.get_for_model(CustomUser)
        
        Notification.objects.create(
            recipient=instance.followed,
            actor=instance.follower,
            verb="przestał Cię obserwować",
            content_type=user_content_type,
            object_id=instance.follower.id
        )
        
        print(f"✅ [SIGNAL] Powiadomienie unfollow utworzone!")
        
    except Exception as e:
        print(f"❌ [SIGNAL ERROR] {e}")

# === OSIĄGNIĘCIA ===
@receiver(post_save, sender=UserAchievement)
def create_achievement_notification(sender, instance, created, **kwargs):
    print(f"🏆 [SIGNAL] UserAchievement post_save - created={created}")
    
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
            
            print(f"✅ [SIGNAL] Achievement notification utworzone!")
            
        except Exception as e:
            print(f"❌ [SIGNAL ERROR] {e}")

print("✅ Sygnały zarejestrowane!")

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Friendship, UserAchievement, Notification, CustomUser, UserProgress

print("📢 Plik signals.py został zaimportowany!")

# === OBSERWOWANIE ===
@receiver(post_save, sender=Friendship)
def create_follow_notification(sender, instance, created, **kwargs):
    print(f"🔔 [SIGNAL] Friendship post_save - created={created}")
    
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
            
            print(f"✅ [SIGNAL] Powiadomienie follow utworzone!")
            
        except Exception as e:
            print(f"❌ [SIGNAL ERROR] {e}")

# === ZAPRZESTANIE OBSERWOWANIA (NOWE!) ===
@receiver(pre_delete, sender=Friendship)
def create_unfollow_notification(sender, instance, **kwargs):
    """Powiadomienie gdy ktoś przestaje obserwować"""
    print(f"🔴 [SIGNAL] Friendship pre_delete")
    
    try:
        user_content_type = ContentType.objects.get_for_model(CustomUser)
        
        Notification.objects.create(
            recipient=instance.followed,
            actor=instance.follower,
            verb="przestał Cię obserwować",
            content_type=user_content_type,
            object_id=instance.follower.id
        )
        
        print(f"✅ [SIGNAL] Powiadomienie unfollow utworzone!")
        
    except Exception as e:
        print(f"❌ [SIGNAL ERROR] {e}")

@receiver(post_save, sender=UserProgress)
def check_ranking_overtake(sender, instance, created, **kwargs):
    """Powiadomienie gdy ktoś przebija Cię w TOP 10 rankingu"""
    
    if not (created and instance.counted_for_ranking and instance.ranking_points > 0):
        return
    
    try:
        from django.db.models import F, Window
        from django.db.models.functions import Rank
        
        active_user = instance.user
        
        # Sprawdź czy jesteśmy w TOP 10
        top_users = CustomUser.objects.annotate(
            rank=Window(
                expression=Rank(),
                order_by=F('total_ranking_points').desc()
            )
        ).filter(
            total_ranking_points__gt=0,
            rank__lte=10
        )
        
        active_user_in_top = top_users.filter(id=active_user.id).exists()
        
        if active_user_in_top:
            user_content_type = ContentType.objects.get_for_model(CustomUser)
            
            # Powiadom wszystkich z TOP 10 (oprócz siebie)
            for other_user in top_users.exclude(id=active_user.id):
                if active_user.total_ranking_points > other_user.total_ranking_points:
                    Notification.objects.create(
                        recipient=other_user,
                        actor=active_user,
                        verb=f"wspiął się w TOP 10! ({active_user.total_ranking_points} pkt)",
                        content_type=user_content_type,
                        object_id=active_user.id
                    )
            
            print(f"🎯 [SIGNAL] {active_user.username} w TOP 10!")
        
    except Exception as e:
        print(f"❌ [SIGNAL ERROR ranking] {e}")