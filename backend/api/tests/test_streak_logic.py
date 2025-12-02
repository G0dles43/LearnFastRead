# api/tests/test_streak_logic.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from ..services import streak_logic

CustomUser = get_user_model()


class StreakLogicTests(TestCase):

    def setUp(self):
        self.today = timezone.now().date()
        self.yesterday = self.today - timedelta(days=1)
        self.two_days_ago = self.today - timedelta(days=2)

    def test_first_training_sets_streak_to_1(self):
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        
        self.assertEqual(user.current_streak, 0)
        self.assertEqual(user.max_streak, 0)
        self.assertIsNone(user.last_streak_date)

        streak_logic.update_user_streak(user)

        self.assertEqual(user.current_streak, 1)
        self.assertEqual(user.max_streak, 1)
        self.assertEqual(user.last_streak_date, self.today)

    def test_training_yesterday_continues_streak(self):
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        user.current_streak = 3
        user.max_streak = 3
        user.last_streak_date = self.yesterday

        streak_logic.update_user_streak(user)

        self.assertEqual(user.current_streak, 4)
        self.assertEqual(user.max_streak, 4)
        self.assertEqual(user.last_streak_date, self.today)

    def test_training_two_days_ago_resets_streak(self):
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        user.current_streak = 5
        user.max_streak = 5
        user.last_streak_date = self.two_days_ago

        streak_logic.update_user_streak(user)

        self.assertEqual(user.current_streak, 1)
        self.assertEqual(user.max_streak, 5) 
        self.assertEqual(user.last_streak_date, self.today)

    def test_training_twice_in_one_day_does_nothing(self):
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        user.current_streak = 1
        user.max_streak = 1
        user.last_streak_date = self.today

        streak_logic.update_user_streak(user)

        self.assertEqual(user.current_streak, 1)
        self.assertEqual(user.max_streak, 1)
        self.assertEqual(user.last_streak_date, self.today)

    def test_streak_continues_and_overtakes_max_streak(self):
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        user.current_streak = 10
        user.max_streak = 10 
        user.last_streak_date = self.yesterday

        streak_logic.update_user_streak(user)

        self.assertEqual(user.current_streak, 11)
        self.assertEqual(user.max_streak, 11)
        self.assertEqual(user.last_streak_date, self.today)