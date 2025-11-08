# api/tests/test_streak_logic.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

# Importujemy funkcję, którą chcemy testować
from ..services import streak_logic

# Używamy get_user_model(), aby pobrać nasz model CustomUser
CustomUser = get_user_model()


class StreakLogicTests(TestCase):

    def setUp(self):
        """
        Ta funkcja uruchamia się przed każdym pojedynczym testem.
        Używamy jej, aby przygotować "dzisiaj" i "wczoraj"
        """
        self.today = timezone.now().date()
        self.yesterday = self.today - timedelta(days=1)
        self.two_days_ago = self.today - timedelta(days=2)

    def test_first_training_sets_streak_to_1(self):
        """
        Test SCENARIUSZA 1: Użytkownik ćwiczy pierwszy raz w życiu.
        """
        # Arrange (Przygotuj)
        # Tworzymy użytkownika w testowej bazie danych
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        
        # Sprawdźmy stan początkowy (dane z modelu CustomUser)
        self.assertEqual(user.current_streak, 0)
        self.assertEqual(user.max_streak, 0)
        self.assertIsNone(user.last_streak_date)

        # Act (Wykonaj)
        # Wołamy naszą funkcję serwisową na tym obiekcie
        streak_logic.update_user_streak(user)

        # Assert (Sprawdź)
        # Nasz serwis modyfikuje obiekt 'user' w pamięci
        self.assertEqual(user.current_streak, 1)
        self.assertEqual(user.max_streak, 1)
        self.assertEqual(user.last_streak_date, self.today)

    def test_training_yesterday_continues_streak(self):
        """
        Test SCENARIUSZA 2: Użytkownik ćwiczył wczoraj i kontynuuje serię.
        """
        # Arrange
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        # Ustawiamy stan "wczorajszy"
        user.current_streak = 3
        user.max_streak = 3
        user.last_streak_date = self.yesterday

        # Act
        streak_logic.update_user_streak(user)

        # Assert
        # Seria powinna wzrosnąć
        self.assertEqual(user.current_streak, 4)
        self.assertEqual(user.max_streak, 4)
        self.assertEqual(user.last_streak_date, self.today)

    def test_training_two_days_ago_resets_streak(self):
        """
        Test SCENARIUSZA 3: Użytkownik pominął dzień, seria się resetuje.
        """
        # Arrange
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        # Ustawiamy stan "przerwanej serii"
        user.current_streak = 5  # Miał 5 dni
        user.max_streak = 5      # Max to 5
        user.last_streak_date = self.two_days_ago

        # Act
        streak_logic.update_user_streak(user)

        # Assert
        # Seria zresetowana do 1
        self.assertEqual(user.current_streak, 1)
        # Maksymalna seria powinna zostać zapamiętana!
        self.assertEqual(user.max_streak, 5) 
        self.assertEqual(user.last_streak_date, self.today)

    def test_training_twice_in_one_day_does_nothing(self):
        """
        Test SCENARIUSZA 4: Użytkownik ćwiczy drugi raz tego samego dnia.
        """
        # Arrange
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        # Ustawiamy stan "już dzisiaj ćwiczył"
        user.current_streak = 1
        user.max_streak = 1
        user.last_streak_date = self.today

        # Act
        streak_logic.update_user_streak(user)

        # Assert
        # Funkcja powinna wyjść na samym początku, nic się nie zmienia
        self.assertEqual(user.current_streak, 1)
        self.assertEqual(user.max_streak, 1)
        self.assertEqual(user.last_streak_date, self.today)

    def test_streak_continues_and_overtakes_max_streak(self):
        """
        Test SCENARIUSZA 5: Obecna seria przebija starą maksymalną serię.
        """
        # Arrange
        user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        # Kiedyś miał 10 dni, ale potem przerwał i teraz ma 10
        user.current_streak = 10
        user.max_streak = 10 
        user.last_streak_date = self.yesterday

        # Act
        streak_logic.update_user_streak(user)

        # Assert
        # Obie wartości rosną
        self.assertEqual(user.current_streak, 11)
        self.assertEqual(user.max_streak, 11)
        self.assertEqual(user.last_streak_date, self.today)