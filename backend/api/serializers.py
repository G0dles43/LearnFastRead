from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import ReadingExercise, UserProgress, Question, Achievement, UserAchievement, ExerciseCollection
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum


User = get_user_model()

class UserStatusSerializer(serializers.ModelSerializer):
    """
    Zwraca kluczowe informacje o statusie użytkownika, w tym serię (streak).
    """
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username', 'is_staff', 'is_superuser', 'is_admin', 
            'current_streak', 'max_streak'
        ]

    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser
    
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

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username
        token['user_id'] = user.id
        
        return token
    
class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'correct_answer', 'question_type', 'option_1', 'option_2', 'option_3', 'option_4']

class ReadingExerciseSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    created_by_id = serializers.ReadOnlyField(source='created_by.id') 
    word_count = serializers.IntegerField(read_only=True) 
    questions = QuestionSerializer(many=True, read_only=True, required=False)
    is_favorite = serializers.SerializerMethodField()
    created_by_is_admin = serializers.SerializerMethodField()
    
    user_attempt_status = serializers.SerializerMethodField()

    class Meta:
        model = ReadingExercise
        fields = ['id', 'title', 'text', 'created_at', 'is_public', 'is_ranked', 
                  'created_by', 'created_by_id', 'word_count', 'questions', 
                  'is_favorite', 'created_by_is_admin',
                  'user_attempt_status' 
                 ]
        read_only_fields = ('created_by', 'created_by_id', 'favorited_by')

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user in obj.favorited_by.all()
        return False
    
    def get_created_by_is_admin(self, obj):
        if obj.created_by:
            return obj.created_by.is_staff 
        return False 
    
    def get_user_attempt_status(self, obj):
        """
        Sprawdza status rankingu użytkownika dla tego ćwiczenia.
        Zwraca: 'rankable', 'training_cooldown', lub 'non_ranked'.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
            
        if not obj.is_ranked:
            return 'non_ranked'
            
        user = request.user
        
        last_ranked = UserProgress.objects.filter(
            user=user,
            exercise=obj,
            counted_for_ranking=True
        ).order_by('-completed_at').first()
        
        if not last_ranked:
            return 'rankable'
            
        one_month_ago = timezone.now() - timedelta(days=30)
        if last_ranked.completed_at >= one_month_ago:
            return 'training_cooldown'
        else:
            return 'rankable'

    def validate(self, data):
        user = self.context['request'].user
        if not user.is_staff:
            if data.get('is_public', False):
                raise serializers.ValidationError("Nie możesz tworzyć ćwiczeń publicznych.")
            if data.get('is_ranked', False):
                raise serializers.ValidationError("Nie możesz tworzyć ćwiczeń ranked.")
        return data
    
    def create(self, validated_data):
        questions_data = self.context['request'].data.get('questions', []) 
        validated_data.pop('questions', None) 
        
        validated_data.pop('favorited_by', None)      

        exercise = ReadingExercise.objects.create(**validated_data)
        
        if questions_data:
            for question_data in questions_data:
                Question.objects.create(exercise=exercise, **question_data)
        
        return exercise
    
class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = '__all__'

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['slug', 'title', 'description', 'icon_name']

class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = ['achievement', 'unlocked_at']

class ExerciseCollectionSerializer(serializers.ModelSerializer):
    """
    Serializer dla modelu ExerciseCollection.
    Zagnieżdża pełny ReadingExerciseSerializer, aby przekazać kontekst.
    """
    exercises = ReadingExerciseSerializer(many=True, read_only=True)
    
    exercise_ids = serializers.PrimaryKeyRelatedField(
        queryset=ReadingExercise.objects.all(),
        source='exercises',
        many=True,
        write_only=True,
        required=False 
    )

    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    exercise_count = serializers.SerializerMethodField()
    total_words = serializers.SerializerMethodField()

    class Meta:
        model = ExerciseCollection
        fields = [
            'id', 'title', 'slug', 'description', 'icon_name', 
            'is_public', 'created_at', 'created_by_username',
            'exercise_count', 'total_words', 
            'exercises',      
            'exercise_ids'    
        ]
        read_only_fields = ['slug']

    def get_exercise_count(self, obj):
        return obj.exercises.count()

    def get_total_words(self, obj):
        return obj.exercises.aggregate(total=Sum('word_count'))['total'] or 0
    
    def validate(self, data):
        user = self.context['request'].user
        
        if 'is_public' in data and data.get('is_public') == True:
            if not user.is_staff:
                raise serializers.ValidationError(
                    "Tylko administratorzy mogą tworzyć kolekcje publiczne."
                )
        return data