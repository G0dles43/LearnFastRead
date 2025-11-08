# api/tests/test_serializers.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from ..serializers import UserSettingsSerializer
from ..wpm_milestones import DEFAULT_WPM_LIMIT
from rest_framework.exceptions import ValidationError

CustomUser = get_user_model()


class UserSettingsSerializerTests(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        self.user.max_wpm_limit = DEFAULT_WPM_LIMIT # Domyślnie 350
        self.user.save()

    def test_validate_speed_allows_speed_below_limit(self):
        """
        Test SCENARIUSZA 1: Użytkownik ustawia dozwoloną prędkość.
        """
        # Arrange
        # Limit WPM to 350. 350 WPM = 171 ms (60000 / 350)
        # Użytkownik ustawia 200 ms (wolniej niż limit)
        data = {'speed': 200}
        serializer = UserSettingsSerializer(instance=self.user, data=data, partial=True)
        
        # Act & Assert
        try:
            serializer.is_valid(raise_exception=True)
            validated_speed = serializer.validated_data['speed']
            self.assertEqual(validated_speed, 200)
        except ValidationError:
            self.fail("Serializer rzucił błąd ValidationError, a nie powinien.")

    def test_validate_speed_blocks_speed_above_limit(self):
        """
        Test SCENARIUSZA 2: Użytkownik próbuje ustawić prędkość ponad limit.
        """
        # Arrange
        # Limit WPM to 350. Minimalny dozwolony czas to 171 ms.
        # Użytkownik próbuje ustawić 100 ms (co odpowiada 600 WPM).
        data = {'speed': 100}
        serializer = UserSettingsSerializer(instance=self.user, data=data, partial=True)
        
        # Act & Assert
        # Oczekujemy, że .is_valid() rzuci błędem
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
            
        # Sprawdź, czy komunikat błędu jest poprawny
        self.assertIn("Nie możesz ustawić prędkości wyższej niż Twój limit", str(context.exception))

    def test_validate_speed_allows_speed_at_the_limit_edge(self):
        """
        Test SCENARIUSZA 3: Ustawianie prędkości idealnie na limicie.
        """
        # Arrange
        # Limit 350 WPM = 171.42 ms. Dajemy 1ms marginesu.
        # Testujemy 171 ms.
        data = {'speed': 171}
        serializer = UserSettingsSerializer(instance=self.user, data=data, partial=True)
        
        # Act & Assert
        try:
            serializer.is_valid(raise_exception=True)
            validated_speed = serializer.validated_data['speed']
            self.assertEqual(validated_speed, 171)
        except ValidationError:
            self.fail("Serializer rzucił błąd ValidationError, a nie powinien.")

    def test_validate_speed_handles_max_limit(self):
        """
        Test SCENARIUSZA 4: Logika dla limitu 1500+ WPM (min 40ms).
        """
        # Arrange
        self.user.max_wpm_limit = 1500
        self.user.save()
        
        # Próba 1: Ustawienie 39ms (zabronione)
        data_fast = {'speed': 39}
        serializer_fast = UserSettingsSerializer(instance=self.user, data=data_fast, partial=True)

        # Próba 2: Ustawienie 40ms (dozwolone)
        data_ok = {'speed': 40}
        serializer_ok = UserSettingsSerializer(instance=self.user, data=data_ok, partial=True)

        # Act & Assert (Próba 1)
        with self.assertRaises(ValidationError):
            serializer_fast.is_valid(raise_exception=True)
            
        # Act & Assert (Próba 2)
        try:
            serializer_ok.is_valid(raise_exception=True)
            self.assertEqual(serializer_ok.validated_data['speed'], 40)
        except ValidationError:
            self.fail("Serializer nie pozwolił na 40ms przy limicie 1500 WPM.")