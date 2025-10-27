from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import ReadingExercise, UserProgress, Question

User = get_user_model()

class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['speed', 'muted', 'mode', 'highlight_width', 'highlight_height', 'chunk_size']

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

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'correct_answer', 'question_type', 'option_1', 'option_2', 'option_3', 'option_4']

class ReadingExerciseSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    created_by_id = serializers.ReadOnlyField(source='created_by.id') 
    word_count = serializers.SerializerMethodField()
    questions = QuestionSerializer(many=True, read_only=False, required=False)
    is_favorite = serializers.SerializerMethodField()  # ZMIENIONE - teraz to metoda

    class Meta:
        model = ReadingExercise
        fields = '__all__'
        read_only_fields = ('created_by', 'created_by_id', 'favorited_by')

    def get_word_count(self, obj):
        return len(obj.text.split())
    
    def get_is_favorite(self, obj):
        """
        Sprawdź czy aktualny użytkownik ma to ćwiczenie w ulubionych
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.favorited_by.all()
        return False
    
    def validate(self, data):
        user = self.context['request'].user
        if not user.is_staff:
            if data.get('is_public', False):
                raise serializers.ValidationError("Nie możesz tworzyć ćwiczeń publicznych.")
            if data.get('is_ranked', False):
                raise serializers.ValidationError("Nie możesz tworzyć ćwiczeń ranked.")
        return data
    
    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        exercise = ReadingExercise.objects.create(**validated_data)
        
        # Tworzenie pytań, jeśli są
        for question_data in questions_data:
            Question.objects.create(exercise=exercise, **question_data)
        
        return exercise
    
class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = '__all__'