from django.test import TestCase
from django.contrib.auth import get_user_model
from ..serializers import UserSettingsSerializer
from ..wpm_milestones import DEFAULT_WPM_LIMIT
from rest_framework.exceptions import ValidationError

CustomUser = get_user_model()


class UserSettingsSerializerTests(TestCase):

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="testuser", email="test@test.com")
        self.user.max_wpm_limit = DEFAULT_WPM_LIMIT
        self.user.save()

    def test_validate_speed_allows_speed_below_limit(self):
        data = {'speed': 200}
        serializer = UserSettingsSerializer(instance=self.user, data=data, partial=True)
        
        try:
            serializer.is_valid(raise_exception=True)
            validated_speed = serializer.validated_data['speed']
            self.assertEqual(validated_speed, 200)
        except ValidationError:
            self.fail("Serializer rzucił błąd ValidationError, a nie powinien.")

    def test_validate_speed_blocks_speed_above_limit(self):
        data = {'speed': 100}
        serializer = UserSettingsSerializer(instance=self.user, data=data, partial=True)
        
        with self.assertRaises(ValidationError) as context:
            serializer.is_valid(raise_exception=True)
            
        self.assertIn("Nie możesz ustawić prędkości wyższej niż Twój limit", str(context.exception))

    def test_validate_speed_allows_speed_at_the_limit_edge(self):
        data = {'speed': 171}
        serializer = UserSettingsSerializer(instance=self.user, data=data, partial=True)
        
        try:
            serializer.is_valid(raise_exception=True)
            validated_speed = serializer.validated_data['speed']
            self.assertEqual(validated_speed, 171)
        except ValidationError:
            self.fail("Serializer rzucił błąd ValidationError, a nie powinien.")

    def test_validate_speed_handles_max_limit(self):
        self.user.max_wpm_limit = 1500
        self.user.save()
        
        data_fast = {'speed': 39}
        serializer_fast = UserSettingsSerializer(instance=self.user, data=data_fast, partial=True)

        data_ok = {'speed': 40}
        serializer_ok = UserSettingsSerializer(instance=self.user, data=data_ok, partial=True)

        with self.assertRaises(ValidationError):
            serializer_fast.is_valid(raise_exception=True)
            
        try:
            serializer_ok.is_valid(raise_exception=True)
            self.assertEqual(serializer_ok.validated_data['speed'], 40)
        except ValidationError:
            self.fail("Serializer nie pozwolił na 40ms przy limicie 1500 WPM.")