# api/tests/test_stats_logic.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import CustomUser, ReadingExercise, UserProgress
from datetime import timedelta
from django.utils import timezone

# Importujemy logikę do testowania
from ..services import stats_logic

CustomUser = get_user_model()


class StatsLogicTests(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        self.exercise = ReadingExercise.objects.create(title="Test", text="test", is_ranked=True)

    def _create_progress(self, wpm, accuracy, points, counted):
        """Pomocnik do tworzenia wpisów UserProgress."""
        return UserProgress.objects.create(
            user=self.user,
            exercise=self.exercise,
            wpm=wpm,
            accuracy=accuracy,
            ranking_points=points,
            counted_for_ranking=counted
        )

    def test_update_user_stats_calculates_correctly(self):
        """
        Test SCENARIUSZA 1: Poprawne obliczanie średnich i sumy.
        """
        # Arrange
        # Próba 1: Liczy się
        self._create_progress(wpm=100, accuracy=100, points=100, counted=True)
        # Próba 2: Liczy się
        self._create_progress(wpm=200, accuracy=50, points=50, counted=True)
        
        # Oczekiwane:
        # total_points = 100 + 50 = 150
        # count = 2
        # avg_wpm = (100 + 200) / 2 = 150
        # avg_accuracy = (100 + 50) / 2 = 75

        # Act
        stats_logic.update_user_stats(self.user)

        # Assert
        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 150)
        self.assertEqual(self.user.ranking_exercises_completed, 2)
        self.assertEqual(self.user.average_wpm, 150.0)
        self.assertEqual(self.user.average_accuracy, 75.0)

    def test_update_user_stats_ignores_non_counted_attempts(self):
        """
        Test SCENARIUSZA 2: Ignorowanie prób nie-rankingowych (treningowych).
        """
        # Arrange
        # Próba 1: Liczy się
        self._create_progress(wpm=100, accuracy=100, points=100, counted=True)
        # Próba 2: Trening (nie liczy się)
        self._create_progress(wpm=1000, accuracy=100, points=0, counted=False)
        
        # Oczekiwane: Statystyki tylko z pierwszej próby

        # Act
        stats_logic.update_user_stats(self.user)

        # Assert
        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 100)
        self.assertEqual(self.user.ranking_exercises_completed, 1)
        self.assertEqual(self.user.average_wpm, 100.0)
        self.assertEqual(self.user.average_accuracy, 100.0)

    def test_update_user_stats_ignores_failed_attempts(self):
        """
        Test SCENARIUSZA 3: Ignorowanie prób z punktami <= 0 (np. niska trafność).
        """
        # Arrange
        # Próba 1: Liczy się
        self._create_progress(wpm=100, accuracy=100, points=100, counted=True)
        # Próba 2: Nieudana (liczona do rankingu, ale 0 pkt)
        self._create_progress(wpm=300, accuracy=40, points=0, counted=True)
        
        # Oczekiwane: Statystyki tylko z pierwszej próby

        # Act
        stats_logic.update_user_stats(self.user)

        # Assert
        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 100)
        self.assertEqual(self.user.ranking_exercises_completed, 1)
        self.assertEqual(self.user.average_wpm, 100.0)
        self.assertEqual(self.user.average_accuracy, 100.0)

    def test_update_user_stats_resets_to_zero_if_no_valid_attempts(self):
        """
        Test SCENARIUSZA 4: Resetowanie statystyk, gdy nie ma żadnych udanych prób.
        """
        # Arrange
        # Ustawiamy wysokie statystyki początkowe
        self.user.total_ranking_points = 1000
        self.user.ranking_exercises_completed = 10
        self.user.average_wpm = 500
        self.user.average_accuracy = 90
        self.user.save()

        # Dodajemy tylko nieudaną próbę
        self._create_progress(wpm=300, accuracy=40, points=0, counted=True)

        # Act
        stats_logic.update_user_stats(self.user)

        # Assert
        # Statystyki powinny zostać wyzerowane (oprócz streaka)
        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 0)
        self.assertEqual(self.user.ranking_exercises_completed, 0)
        self.assertEqual(self.user.average_wpm, 0)
        self.assertEqual(self.user.average_accuracy, 0)

    def test_update_user_stats_preserves_streak_data(self):
        """
        Test SCENARIUSZA 5: Aktualizacja statystyk nie psuje danych o streaku.
        """
        # Arrange
        # Ustawiamy dane streaka (funkcja stats_logic ich nie rusza,
        # ale dyrygent submission_service upewnia się, że są zapisane)
        self.user.current_streak = 5
        self.user.max_streak = 10
        self.user.last_streak_date = timezone.now().date() - timedelta(days=1)
        self.user.save()
        
        # Dodajemy udaną próbę
        self._create_progress(wpm=100, accuracy=100, points=100, counted=True)
        
        # Act
        stats_logic.update_user_stats(self.user)

        # Assert
        self.user.refresh_from_db()
        # Statystyki rankingu są zaktualizowane
        self.assertEqual(self.user.total_ranking_points, 100)
        self.assertEqual(self.user.ranking_exercises_completed, 1)
        # Statystyki streaka są NIETKNIĘTE (bo stats_logic ich nie zapisuje
        # w 'update_fields')
        self.assertEqual(self.user.current_streak, 5)
        self.assertEqual(self.user.max_streak, 10)