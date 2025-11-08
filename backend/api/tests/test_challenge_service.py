# api/tests/test_challenge_service.py

from django.test import TestCase
from django.utils import timezone
from datetime import datetime
from unittest import mock

# Importujemy nasze modele i serwis
from ..models import ReadingExercise
from ..services import challenge_service

class ChallengeServiceTests(TestCase):

    def setUp(self):
        # Tworzymy 3 ćwiczenia rankingowe i publiczne
        self.ex1 = ReadingExercise.objects.create(
            title="Wyzwanie 1", text="text", is_ranked=True, is_public=True
        )
        self.ex2 = ReadingExercise.objects.create(
            title="Wyzwanie 2", text="text", is_ranked=True, is_public=True
        )
        self.ex3 = ReadingExercise.objects.create(
            title="Wyzwanie 3", text="text", is_ranked=True, is_public=True
        )
        
        # Tworzymy 1 ćwiczenie, które jest tylko rankingowe (awaryjne)
        self.ex_ranked_only = ReadingExercise.objects.create(
            title="Tylko Rankingowe", text="text", is_ranked=True, is_public=False
        )
        
        # Tworzymy 1 ćwiczenie, które jest tylko publiczne
        self.ex_public_only = ReadingExercise.objects.create(
            title="Tylko Publiczne", text="text", is_ranked=False, is_public=True
        )

    @mock.patch('api.services.challenge_service.timezone')
    def test_get_challenge_selects_correctly_based_on_day(self, mock_timezone):
        """
        Test SCENARIUSZA 1: Algorytm (dzień % liczba) wybiera poprawnie.
        """
        # Arrange
        # Mamy 3 kwalifikujące się ćwiczenia (ex1, ex2, ex3).
        # Ustawmy "dzień roku" na 5.
        # 5 % 3 = 2.
        # Indeks 2 (czyli trzecie ćwiczenie) to self.ex3.
        
        # Tworzymy fałszywą datę, która ma dzień roku = 5
        mock_date = datetime(2024, 1, 5) # 5 stycznia to 5. dzień roku
        mock_timezone.now.return_value = timezone.make_aware(mock_date)
        
        self.assertEqual(mock_timezone.now().timetuple().tm_yday, 5)

        # Act
        challenge = challenge_service.get_today_challenge()
        
        # Assert
        # Ćwiczenia są sortowane po 'id', a my je tak tworzyliśmy.
        # ex1 (indeks 0), ex2 (indeks 1), ex3 (indeks 2)
        self.assertIsNotNone(challenge)
        self.assertEqual(challenge, self.ex3)

    @mock.patch('api.services.challenge_service.timezone')
    def test_get_challenge_selects_another_day(self, mock_timezone):
        """
        Test SCENARIUSZA 2: Algorytm (dzień % liczba) wybiera poprawnie (inny dzień).
        """
        # Arrange
        # Dzień roku = 4. 4 % 3 = 1. Indeks 1 to self.ex2.
        mock_date = datetime(2024, 1, 4)
        mock_timezone.now.return_value = timezone.make_aware(mock_date)
        
        # Act
        challenge = challenge_service.get_today_challenge()
        
        # Assert
        self.assertIsNotNone(challenge)
        self.assertEqual(challenge, self.ex2)

    def test_get_challenge_fallback_to_any_ranked(self):
        """
        Test SCENARIUSZA 3: Brak ćwiczeń (public + ranked), ale jest (ranked).
        """
        # Arrange
        # Usuwamy wszystkie ćwiczenia (public + ranked)
        ReadingExercise.objects.filter(is_public=True, is_ranked=True).delete()
        
        # Zostało nam tylko self.ex_ranked_only i self.ex_public_only
        self.assertEqual(ReadingExercise.objects.count(), 2)

        # Act
        challenge = challenge_service.get_today_challenge()
        
        # Assert
        # Serwis powinien znaleźć self.ex_ranked_only jako wyjście awaryjne
        self.assertIsNotNone(challenge)
        self.assertEqual(challenge, self.ex_ranked_only)

    def test_get_challenge_returns_none_if_no_ranked_at_all(self):
        """
        Test SCENARIUSZA 4: Brak JAKICHKOLWIEK ćwiczeń rankingowych.
        """
        # Arrange
        # Usuwamy WSZYSTKO, co jest ranked
        ReadingExercise.objects.filter(is_ranked=True).delete()
        
        # Zostało nam tylko self.ex_public_only
        self.assertEqual(ReadingExercise.objects.count(), 1)

        # Act
        challenge = challenge_service.get_today_challenge()
        
        # Assert
        self.assertIsNone(challenge)