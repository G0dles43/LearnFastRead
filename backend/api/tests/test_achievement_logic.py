from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import CustomUser, ReadingExercise, UserProgress, Achievement, UserAchievement

from ..services import achievement_logic

CustomUser = get_user_model()


class AchievementLogicTests(TestCase):

    def setUp(self):
        """
        Przygotuj użytkownika i bazowe osiągnięcia (muszą pasować slugami!)
        """
        self.user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        
        self.exercise_normal = ReadingExercise.objects.create(title="Normalny Tekst", text="słowo " * 400, is_ranked=True) 
        self.exercise_long = ReadingExercise.objects.create(title="Długi Tekst", text="słowo " * 900, is_ranked=True) 
        
        Achievement.objects.create(slug="wpm_300", title="WPM 300")
        Achievement.objects.create(slug="wpm_800", title="WPM 800")
        Achievement.objects.create(slug="accuracy_100", title="Perfekcjonista")
        Achievement.objects.create(slug="marathoner", title="Maratończyk")
        Achievement.objects.create(slug="daily_challenger", title="Wyzwanie Dnia")

    def _create_test_progress(self, exercise, wpm, accuracy, ranked=True, points=100, daily=False):
        """
        Funkcja pomocnicza do tworzenia obiektu UserProgress
        """
        return UserProgress(
            user=self.user,
            exercise=exercise,
            wpm=wpm,
            accuracy=accuracy,
            counted_for_ranking=ranked,
            ranking_points=points, 
            completed_daily_challenge=daily
        )

    def test_award_wpm_300(self):
        """
        Test SCENARIUSZA 1: Odblokowanie 'wpm_300'
        """
        progress = self._create_test_progress(self.exercise_normal, 301, 90)
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 1)
        self.assertEqual(new_achievements[0].slug, "wpm_300")
        self.assertTrue(UserAchievement.objects.filter(user=self.user, achievement__slug="wpm_300").exists())

    def test_award_wpm_800_and_300_at_once(self):
        """
        Test SCENARIUSZA 2: Odblokowanie 'wpm_800' powinno też dać 'wpm_300'
        """
        progress = self._create_test_progress(self.exercise_normal, 850, 90)
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 2)
        slugs = {ach.slug for ach in new_achievements}
        self.assertEqual(slugs, {"wpm_300", "wpm_800"})
        self.assertTrue(UserAchievement.objects.filter(user=self.user).count(), 2)

    def test_award_accuracy_100(self):
        """
        Test SCENARIUSZA 3: Odblokowanie 'accuracy_100'
        """
        progress = self._create_test_progress(self.exercise_normal, 200, 100)
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 1)
        self.assertEqual(new_achievements[0].slug, "accuracy_100")

    def test_award_marathoner(self):
        """
        Test SCENARIUSZA 4: Odblokowanie 'marathoner'
        """
        progress = self._create_test_progress(self.exercise_long, 200, 90) # Używamy DŁUGIEGO tekstu
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 1)
        self.assertEqual(new_achievements[0].slug, "marathoner")

    def test_award_daily_challenger(self):
        """
        Test SCENARIUSZA 5: Odblokowanie 'daily_challenger'
        """
        progress = self._create_test_progress(self.exercise_normal, 200, 90, daily=True) # Ustawiamy flagę
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 1)
        self.assertEqual(new_achievements[0].slug, "daily_challenger")

    def test_award_multiple_at_once(self):
        """
        Test SCENARIUSZA 6: Odblokowanie kilku na raz (Maratończyk, 800+ WPM, 100% Acc)
        """
        progress = self._create_test_progress(self.exercise_long, 900, 100) # Wszystkie warunki spełnione
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 4) # wpm_300, wpm_800, accuracy_100, marathoner
        slugs = {ach.slug for ach in new_achievements}
        self.assertEqual(slugs, {"wpm_300", "wpm_800", "accuracy_100", "marathoner"})

    def test_no_award_if_failed_attempt(self):
        """
        Test SCENARIUSZA 7: Brak nagród, jeśli ranking_points = 0
        """
        progress = self._create_test_progress(self.exercise_long, 900, 100, points=0) # Spełnia WPM/Acc, ale punkty = 0
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 0)
        self.assertEqual(UserAchievement.objects.filter(user=self.user).count(), 0)

    def test_no_award_if_not_counted_for_ranking(self):
        """
        Test SCENARIUSZA 8: Brak nagród, jeśli counted_for_ranking = False
        """
        progress = self._create_test_progress(self.exercise_long, 900, 100, ranked=False) # Spełnia WPM/Acc, ale próba nierankingowa
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 0)
        self.assertEqual(UserAchievement.objects.filter(user=self.user).count(), 0)

    def test_no_duplicate_awards(self):
        """
        Test SCENARIUSZA 9: Nie przyznawaj duplikatów
        """
        ach_300 = Achievement.objects.get(slug="wpm_300")
        UserAchievement.objects.create(user=self.user, achievement=ach_300)
        
        progress = self._create_test_progress(self.exercise_normal, 301, 90) # Kwalifikuje się do wpm_300
        
        new_achievements = achievement_logic.check_for_new_achievements(self.user, progress)
        
        self.assertEqual(len(new_achievements), 0)
        self.assertEqual(UserAchievement.objects.filter(user=self.user).count(), 1)
        self.assertEqual(UserAchievement.objects.get(user=self.user).achievement, ach_300)