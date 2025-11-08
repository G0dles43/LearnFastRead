# api/tests/test_ranking_logic.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest import mock  # Ważny import do "zaślepiania"

# Importujemy nasze modele
from ..models import CustomUser, ReadingExercise, UserProgress

# Importujemy logikę do testowania
from ..services import ranking_logic

# Używamy get_user_model(), aby pobrać nasz model CustomUser
CustomUser = get_user_model()


class RankingLogicTests(TestCase):

    def setUp(self):
        """
        Przygotuj wspólne obiekty dla wszystkich testów.
        """
        # Tworzymy użytkownika i ćwiczenie, których będziemy używać wielokrotnie
        self.user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        
        self.exercise_short = ReadingExercise.objects.create(
            title="Krótki Tekst",
            text="To jest tekst mający mniej niż 300 słów.", # ~8 słów
            is_ranked=True
        )
        
        long_text = "słowo " * 900 # To da 900 słów
    
        self.exercise_long = ReadingExercise.objects.create(
            title="Długi Tekst",
            text=long_text, # <-- TERAZ MA 900 SŁÓW
            is_ranked=True
        )
        
        # Ustawiamy daty, aby mieć nad nimi kontrolę
        self.now = timezone.now()
        self.one_month_ago = self.now - timedelta(days=31) # "31" dla bezpieczeństwa

    # --- Testy dla determine_ranking_eligibility ---

    def test_eligibility_first_attempt_is_counted(self):
        """
        Test SCENARIUSZA 1: Pierwsza próba dla danego ćwiczenia.
        """
        # Arrange
        # Tworzymy "pusty" obiekt postępu, tak jak robi to serwis
        progress = UserProgress(user=self.user, exercise=self.exercise_short)
        
        # Act
        old_attempt_to_deactivate = ranking_logic.determine_ranking_eligibility(progress)

        # Assert
        self.assertTrue(progress.counted_for_ranking)
        self.assertEqual(progress.attempt_number, 1)
        self.assertIsNone(old_attempt_to_deactivate) # Nie było starej próby

    def test_eligibility_second_attempt_within_cooldown_is_not_counted(self):
        """
        Test SCENARIUSZA 2: Druga próba zbyt szybko po pierwszej.
        """
        # Arrange
        # Symulujemy pierwszą, zaliczoną próbę (zapisujemy ją w bazie)
        UserProgress.objects.create(
            user=self.user,
            exercise=self.exercise_short,
            wpm=300, accuracy=100,
            counted_for_ranking=True,
            completed_at=self.now # Zrobiona dzisiaj
        )
        
        # Tworzymy "pusty" obiekt dla nowej próby
        progress = UserProgress(user=self.user, exercise=self.exercise_short)

        # Act
        old_attempt_to_deactivate = ranking_logic.determine_ranking_eligibility(progress)

        # Assert
        self.assertFalse(progress.counted_for_ranking) # Nie liczy się!
        self.assertEqual(progress.attempt_number, 2) # To druga próba
        self.assertIsNone(old_attempt_to_deactivate)

    def test_eligibility_second_attempt_after_cooldown_is_counted(self):
        """
        Test SCENARIUSZA 3: Druga próba po upływie 30 dni (cooldown).
        """
        # Arrange
        # Symulujemy pierwszą próbę
        first_attempt = UserProgress.objects.create(
            user=self.user,
            exercise=self.exercise_short,
            wpm=300, accuracy=100,
            counted_for_ranking=True
            # Data 'completed_at' jest teraz ustawiona na 'self.now'
        )
        
        # A TERAZ NADPISUJEMY DATĘ RĘCZNIE
        first_attempt.completed_at = self.one_month_ago
        first_attempt.save() # Zapisujemy zmianę

        progress = UserProgress(user=self.user, exercise=self.exercise_short)

        # Act
        old_attempt_to_deactivate = ranking_logic.determine_ranking_eligibility(progress)

        # Assert
        self.assertTrue(progress.counted_for_ranking) # Teraz powinno być True
        self.assertEqual(progress.attempt_number, 2)
        self.assertEqual(old_attempt_to_deactivate, first_attempt)

    @mock.patch('api.services.ranking_logic.get_today_challenge') # Zaślepiamy import
    def test_points_calculation_normal_exercise(self, mock_get_challenge):
        """
        Test SCENARIUSZA 4: Obliczanie punktów (zwykłe ćwiczenie).
        """
        # Arrange
        # Ustawiamy, że "Wyzwanie Dnia" to INNE ćwiczenie (ID 999)
        mock_get_challenge.return_value = ReadingExercise(id=999) 
        
        progress = UserProgress(
            user=self.user,
            exercise=self.exercise_short, # Nasz tekst ma ~8 słów (mnożnik 0.8)
            wpm=500,
            accuracy=100,
            counted_for_ranking=True # Załóżmy, że się liczy
        )
        
        # Oczekiwany wynik: 500 (WPM) * 1.0 (Acc) * 0.8 (mnożnik długości) = 400
        
        # Act
        ranking_logic.calculate_final_points(progress)
        
        # Assert
        self.assertEqual(progress.ranking_points, 400)
        self.assertFalse(progress.completed_daily_challenge)

    @mock.patch('api.services.ranking_logic.get_today_challenge')
    def test_points_calculation_with_daily_challenge_bonus(self, mock_get_challenge):
        """
        Test SCENARIUSZA 5: Obliczanie punktów (z bonusem +50).
        """
        # Arrange
        # Ustawiamy, że TO ćwiczenie jest Wyzwaniem Dnia
        mock_get_challenge.return_value = self.exercise_short
        
        progress = UserProgress(
            user=self.user,
            exercise=self.exercise_short,
            wpm=500,
            accuracy=100,
            counted_for_ranking=True
        )
        
        # Oczekiwany wynik: 400 (baza) + 50 (bonus) = 450
        
        # Act
        ranking_logic.calculate_final_points(progress)
        
        # Assert
        self.assertEqual(progress.ranking_points, 450)
        self.assertTrue(progress.completed_daily_challenge)

    @mock.patch('api.services.ranking_logic.get_today_challenge')
    def test_points_calculation_failed_accuracy(self, mock_get_challenge):
        """
        Test SCENARIUSZA 6: Zbyt niska trafność zeruje punkty (nawet z bonusem).
        """
        # Arrange
        mock_get_challenge.return_value = self.exercise_short # To jest Wyzwanie Dnia
        
        progress = UserProgress(
            user=self.user,
            exercise=self.exercise_short,
            wpm=1000, # Super WPM
            accuracy=59.9, # Ale trafność za niska
            counted_for_ranking=True
        )
        
        # Oczekiwany wynik: 0 (bo accuracy < 60)
        
        # Act
        ranking_logic.calculate_final_points(progress)
        
        # Assert
        self.assertEqual(progress.ranking_points, 0)
        self.assertFalse(progress.completed_daily_challenge)

    @mock.patch('api.services.ranking_logic.get_today_challenge')
    def test_points_calculation_long_text_multiplier(self, mock_get_challenge):
        """
        Test SCENARIUSZA 7: Sprawdzenie mnożnika dla długiego tekstu.
        """
        # Arrange
        mock_get_challenge.return_value = None # Brak wyzwania
        
        progress = UserProgress(
            user=self.user,
            exercise=self.exercise_long, # Nasz tekst ma ~800+ słów (mnożnik 1.5)
            wpm=100,
            accuracy=80,
            counted_for_ranking=True
        )
        
        # Oczekiwany wynik: 100 (WPM) * 0.8 (Acc) * 1.5 (mnożnik długości) = 120
        
        # Act
        ranking_logic.calculate_final_points(progress)
        
        # Assert
        self.assertEqual(progress.ranking_points, 120)
        self.assertFalse(progress.completed_daily_challenge)