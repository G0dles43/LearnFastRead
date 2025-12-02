# api/tests/test_stats_logic.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from ..models import CustomUser, ReadingExercise, UserProgress
from datetime import timedelta
from django.utils import timezone

from ..services import stats_logic

CustomUser = get_user_model()


class StatsLogicTests(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        self.exercise = ReadingExercise.objects.create(title="Test", text="test", is_ranked=True)

    def _create_progress(self, wpm, accuracy, points, counted):
        return UserProgress.objects.create(
            user=self.user,
            exercise=self.exercise,
            wpm=wpm,
            accuracy=accuracy,
            ranking_points=points,
            counted_for_ranking=counted
        )

    def test_update_user_stats_calculates_correctly(self):
        self._create_progress(wpm=100, accuracy=100, points=100, counted=True)
        self._create_progress(wpm=200, accuracy=50, points=50, counted=True)

        stats_logic.update_user_stats(self.user)

        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 150)
        self.assertEqual(self.user.ranking_exercises_completed, 2)
        self.assertEqual(self.user.average_wpm, 150.0)
        self.assertEqual(self.user.average_accuracy, 75.0)

    def test_update_user_stats_ignores_non_counted_attempts(self):
        self._create_progress(wpm=100, accuracy=100, points=100, counted=True)
        self._create_progress(wpm=1000, accuracy=100, points=0, counted=False)

        stats_logic.update_user_stats(self.user)

        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 100)
        self.assertEqual(self.user.ranking_exercises_completed, 1)
        self.assertEqual(self.user.average_wpm, 100.0)
        self.assertEqual(self.user.average_accuracy, 100.0)

    def test_update_user_stats_ignores_failed_attempts(self):
        self._create_progress(wpm=100, accuracy=100, points=100, counted=True)
        self._create_progress(wpm=300, accuracy=40, points=0, counted=True)

        stats_logic.update_user_stats(self.user)

        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 100)
        self.assertEqual(self.user.ranking_exercises_completed, 1)
        self.assertEqual(self.user.average_wpm, 100.0)
        self.assertEqual(self.user.average_accuracy, 100.0)

    def test_update_user_stats_resets_to_zero_if_no_valid_attempts(self):
        self.user.total_ranking_points = 1000
        self.user.ranking_exercises_completed = 10
        self.user.average_wpm = 500
        self.user.average_accuracy = 90
        self.user.save()

        self._create_progress(wpm=300, accuracy=40, points=0, counted=True)

        stats_logic.update_user_stats(self.user)

        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 0)
        self.assertEqual(self.user.ranking_exercises_completed, 0)
        self.assertEqual(self.user.average_wpm, 0)
        self.assertEqual(self.user.average_accuracy, 0)

    def test_update_user_stats_preserves_streak_data(self):
        self.user.current_streak = 5
        self.user.max_streak = 10
        self.user.last_streak_date = timezone.now().date() - timedelta(days=1)
        self.user.save()
        
        self._create_progress(wpm=100, accuracy=100, points=100, counted=True)
        
        stats_logic.update_user_stats(self.user)

        self.user.refresh_from_db()
        self.assertEqual(self.user.total_ranking_points, 100)
        self.assertEqual(self.user.ranking_exercises_completed, 1)
        self.assertEqual(self.user.current_streak, 5)
        self.assertEqual(self.user.max_streak, 10)