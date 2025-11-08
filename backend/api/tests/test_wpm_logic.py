# api/tests/test_wpm_logic.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import CustomUser, ReadingExercise, UserProgress, Notification
from ..wpm_milestones import DEFAULT_WPM_LIMIT, WPM_MILESTONES

# Importujemy logikę do testowania
from ..services import wpm_logic

CustomUser = get_user_model()


class WPMLogicTests(TestCase):

    def setUp(self):
        """
        Przygotuj użytkownika i ćwiczenie.
        """
        self.user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        # Upewnijmy się, że użytkownik zaczyna z domyślnym limitem
        self.user.max_wpm_limit = DEFAULT_WPM_LIMIT # Domyślnie 350
        self.user.save()
        
        self.ranked_exercise = ReadingExercise.objects.create(
            title="Tekst rankingowy", 
            text="słowo " * 100, 
            is_ranked=True
        )
        
        self.non_ranked_exercise = ReadingExercise.objects.create(
            title="Tekst treningowy", 
            text="słowo " * 100, 
            is_ranked=False
        )

    def _create_test_progress(self, exercise, wpm, accuracy):
        """
        Funkcja pomocnicza do tworzenia obiektu UserProgress
        """
        # Ważne: Tworzymy obiekt w pamięci, tak jak robi to serwis
        # przed przekazaniem go do wpm_logic.
        return UserProgress(
            user=self.user,
            exercise=exercise,
            wpm=wpm,
            accuracy=accuracy
        )

    def test_unlocks_new_wpm_milestone_on_success(self):
        """
        Test SCENARIUSZA 1: Użytkownik przekracza limit WPM i Accuracy.
        """
        progress = self._create_test_progress(self.ranked_exercise, 360, 90)
        
        new_limit = wpm_logic.check_and_update_wpm_milestone(self.user, progress)
        
        self.assertEqual(new_limit, 500)
        
        self.user.refresh_from_db() 
        self.assertEqual(self.user.max_wpm_limit, 500)
        
        self.assertEqual(Notification.objects.count(), 1)
        notification = Notification.objects.first()
        self.assertEqual(notification.recipient, self.user)
        self.assertIn("odblokował nowy limit prędkości: 500 WPM", notification.verb)

    def test_does_not_unlock_if_accuracy_too_low(self):
        """
        Test SCENARIUSZA 2: WPM jest OK, ale trafność (accuracy) jest za niska.
        """
        progress = self._create_test_progress(self.ranked_exercise, 360, 59.9) # Poniżej progu 60
        
        new_limit = wpm_logic.check_and_update_wpm_milestone(self.user, progress)
        
        self.assertIsNone(new_limit)
        self.user.refresh_from_db()
        self.assertEqual(self.user.max_wpm_limit, DEFAULT_WPM_LIMIT) # Pozostaje 350
        self.assertEqual(Notification.objects.count(), 0) # Brak powiadomienia

    def test_does_not_unlock_if_wpm_too_low(self):
        """
        Test SCENARIUSZA 3: Trafność OK, ale WPM poniżej *aktualnego* limitu.
        """
        progress = self._create_test_progress(self.ranked_exercise, 349, 100) # Poniżej progu 350
        
        new_limit = wpm_logic.check_and_update_wpm_milestone(self.user, progress)
        
        self.assertIsNone(new_limit)
        self.user.refresh_from_db()
        self.assertEqual(self.user.max_wpm_limit, DEFAULT_WPM_LIMIT)
        self.assertEqual(Notification.objects.count(), 0)

    def test_does_not_unlock_if_exercise_not_ranked(self):
        """
        Test SCENARIUSZA 4: Wynik idealny, ale ćwiczenie nie-rankingowe.
        """
        progress = self._create_test_progress(self.non_ranked_exercise, 360, 100)
        
        new_limit = wpm_logic.check_and_update_wpm_milestone(self.user, progress)
        
        self.assertIsNone(new_limit)
        self.user.refresh_from_db()
        self.assertEqual(self.user.max_wpm_limit, DEFAULT_WPM_LIMIT)
        self.assertEqual(Notification.objects.count(), 0)

    def test_does_not_unlock_if_already_at_max_limit(self):
        """
        Test SCENARIUSZA 5: Użytkownik jest na maksymalnym limicie (1500).
        """
        max_possible_limit = max(WPM_MILESTONES.values()) # 1500
        self.user.max_wpm_limit = max_possible_limit
        self.user.save()
        
        progress = self._create_test_progress(self.ranked_exercise, 2000, 100) # Przekracza limit
        
        new_limit = wpm_logic.check_and_update_wpm_milestone(self.user, progress)
        
        self.assertIsNone(new_limit)
        self.user.refresh_from_db()
        self.assertEqual(self.user.max_wpm_limit, max_possible_limit) # Zostaje 1500
        self.assertEqual(Notification.objects.count(), 0)