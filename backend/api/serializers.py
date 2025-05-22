from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import ReadingExercise, UserProgress

User = get_user_model()

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['speed', 'muted']
        
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        return user

class ReadingExerciseSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    created_by_id = serializers.ReadOnlyField(source='created_by.id') 
    word_count = serializers.SerializerMethodField()

    class Meta:
        model = ReadingExercise
        fields = '__all__'
        read_only_fields = ('created_by', 'created_by_id')

    def get_word_count(self, obj):
        return len(obj.text.split())
    
class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = '__all__'

