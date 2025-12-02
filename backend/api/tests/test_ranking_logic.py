from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest import mock  

from ..models import CustomUser, ReadingExercise, UserProgress

from ..services import ranking_logic

CustomUser = get_user_model()


class RankingLogicTests(TestCase):

    def setUp(self):
        """
        Przygotuj wspólne obiekty dla wszystkich testów.
        """
        self.user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        
        self.exercise_short = ReadingExercise.objects.create(
            title="Krótki Tekst",
            text="To jest tekst mający mniej niż 300 słów.", 
            is_ranked=True
        )
        
        long_text = "słowo " * 900 
    
        self.exercise_long = ReadingExercise.objects.create(
            title="Długi Tekst",
            text=long_text, 
            is_ranked=True
        )
        
        self.now = timezone.now()
        self.one_month_ago = self.now - timedelta(days=31) 


    def test_eligibility_first_attempt_is_counted(self):
        """
        Test SCENARIUSZA 1: Pierwsza próba dla danego ćwiczenia.
        """
        progress = UserProgress(user=self.user, exercise=self.exercise_short)
        
        old_attempt_to_deactivate = ranking_logic.determine_ranking_eligibility(progress)

        self.assertTrue(progress.counted_for_ranking)
        self.assertEqual(progress.attempt_number, 1)
        self.assertIsNone(old_attempt_to_deactivate)

    def test_eligibility_second_attempt_within_cooldown_is_not_counted(self):
        """
        Test SCENARIUSZA 2: Druga próba zbyt szybko po pierwszej.
        """
        UserProgress.objects.create(
            user=self.user,
            exercise=self.exercise_short,
            wpm=300, accuracy=100,
            counted_for_ranking=True,
            completed_at=self.now 
        )
        
        progress = UserProgress(user=self.user, exercise=self.exercise_short)

        old_attempt_to_deactivate = ranking_logic.determine_ranking_eligibility(progress)

        self.assertFalse(progress.counted_for_ranking)
        self.assertEqual(progress.attempt_number, 2)
        self.assertIsNone(old_attempt_to_deactivate)

    def test_eligibility_second_attempt_after_cooldown_is_counted(self):
        """
        Test SCENARIUSZA 3: Druga próba po upływie 30 dni (cooldown).
        """
        first_attempt = UserProgress.objects.create(
            user=self.user,
            exercise=self.exercise_short,
            wpm=300, accuracy=100,
            counted_for_ranking=True
        )
        
        first_attempt.completed_at = self.one_month_ago
        first_attempt.save() 

        progress = UserProgress(user=self.user, exercise=self.exercise_short)

        old_attempt_to_deactivate = ranking_logic.determine_ranking_eligibility(progress)

        self.assertTrue(progress.counted_for_ranking)
        self.assertEqual(progress.attempt_number, 2)
        self.assertEqual(old_attempt_to_deactivate, first_attempt)

    @mock.patch('api.services.ranking_logic.get_today_challenge') 
    def test_points_calculation_normal_exercise(self, mock_get_challenge):
        """
        Test SCENARIUSZA 4: Obliczanie punktów (zwykłe ćwiczenie).
        """
        mock_get_challenge.return_value = ReadingExercise(id=999) 
        
        progress = UserProgress(
            user=self.user,
            exercise=self.exercise_short,
            wpm=500,
            accuracy=100,
            counted_for_ranking=True
        )
        
        ranking_logic.calculate_final_points(progress)
        
        self.assertEqual(progress.ranking_points, 400)
        self.assertFalse(progress.completed_daily_challenge)

    @mock.patch('api.services.ranking_logic.get_today_challenge')
    def test_points_calculation_with_daily_challenge_bonus(self, mock_get_challenge):
        """
        Test SCENARIUSZA 5: Obliczanie punktów (z bonusem +50).
        """
        mock_get_challenge.return_value = self.exercise_short
        
        progress = UserProgress(
            user=self.user,
            exercise=self.exercise_short,
            wpm=500,
            accuracy=100,
            counted_for_ranking=True
        )
        
        ranking_logic.calculate_final_points(progress)
        
        self.assertEqual(progress.ranking_points, 450)
        self.assertTrue(progress.completed_daily_challenge)

    @mock.patch('api.services.ranking_logic.get_today_challenge')
    def test_points_calculation_failed_accuracy(self, mock_get_challenge):
        """
        Test SCENARIUSZA 6: Zbyt niska trafność zeruje punkty (nawet z bonusem).
        """
        mock_get_challenge.return_value = self.exercise_short 
        
        progress = UserProgress(
            user=self.user,
            exercise=self.exercise_short,
            wpm=1000, 
            accuracy=59.9, 
            counted_for_ranking=True
        )
        
        
        ranking_logic.calculate_final_points(progress)
        
        self.assertEqual(progress.ranking_points, 0)
        self.assertFalse(progress.completed_daily_challenge)

    @mock.patch('api.services.ranking_logic.get_today_challenge')
    def test_points_calculation_long_text_multiplier(self, mock_get_challenge):
        """
        Test SCENARIUSZA 7: Sprawdzenie mnożnika dla długiego tekstu.
        """
        mock_get_challenge.return_value = None 
        
        progress = UserProgress(
            user=self.user,
            exercise=self.exercise_long, 
            wpm=100,
            accuracy=80,
            counted_for_ranking=True
        )
        
        ranking_logic.calculate_final_points(progress)
        
        self.assertEqual(progress.ranking_points, 120)
        self.assertFalse(progress.completed_daily_challenge)