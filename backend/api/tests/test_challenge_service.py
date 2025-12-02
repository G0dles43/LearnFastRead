from django.test import TestCase
from django.utils import timezone
from datetime import datetime
from unittest import mock

from ..models import ReadingExercise
from ..services import challenge_service

class ChallengeServiceTests(TestCase):

    def setUp(self):
        self.ex1 = ReadingExercise.objects.create(
            title="Wyzwanie 1", text="text", is_ranked=True, is_public=True
        )
        self.ex2 = ReadingExercise.objects.create(
            title="Wyzwanie 2", text="text", is_ranked=True, is_public=True
        )
        self.ex3 = ReadingExercise.objects.create(
            title="Wyzwanie 3", text="text", is_ranked=True, is_public=True
        )
        
        self.ex_ranked_only = ReadingExercise.objects.create(
            title="Tylko Rankingowe", text="text", is_ranked=True, is_public=False
        )
        
        self.ex_public_only = ReadingExercise.objects.create(
            title="Tylko Publiczne", text="text", is_ranked=False, is_public=True
        )

    @mock.patch('api.services.challenge_service.timezone')
    def test_get_challenge_selects_correctly_based_on_day(self, mock_timezone):
        """
        Test SCENARIUSZA 1: Algorytm (dzień % liczba) wybiera poprawnie.
        """
        mock_date = datetime(2024, 1, 5) 
        mock_timezone.now.return_value = timezone.make_aware(mock_date)
        
        self.assertEqual(mock_timezone.now().timetuple().tm_yday, 5)

        challenge = challenge_service.get_today_challenge()
        
        self.assertIsNotNone(challenge)
        self.assertEqual(challenge, self.ex3)

    @mock.patch('api.services.challenge_service.timezone')
    def test_get_challenge_selects_another_day(self, mock_timezone):
        """
        Test SCENARIUSZA 2: Algorytm (dzień % liczba) wybiera poprawnie (inny dzień).
        """
        mock_date = datetime(2024, 1, 4)
        mock_timezone.now.return_value = timezone.make_aware(mock_date)
        
        challenge = challenge_service.get_today_challenge()
        
        self.assertIsNotNone(challenge)
        self.assertEqual(challenge, self.ex2)

    def test_get_challenge_fallback_to_any_ranked(self):
        """
        Test SCENARIUSZA 3: Brak ćwiczeń (public + ranked), ale jest (ranked).
        """
        ReadingExercise.objects.filter(is_public=True, is_ranked=True).delete()
        
        self.assertEqual(ReadingExercise.objects.count(), 2)

        challenge = challenge_service.get_today_challenge()
        
        self.assertIsNotNone(challenge)
        self.assertEqual(challenge, self.ex_ranked_only)

    def test_get_challenge_returns_none_if_no_ranked_at_all(self):
        """
        Test SCENARIUSZA 4: Brak JAKICHKOLWIEK ćwiczeń rankingowych.
        """
        ReadingExercise.objects.filter(is_ranked=True).delete()
        
        self.assertEqual(ReadingExercise.objects.count(), 1)

        challenge = challenge_service.get_today_challenge()
        
        self.assertIsNone(challenge)