from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Notification, Friendship, ReadingExercise, UserProgress, Question, Achievement, UserAchievement, ExerciseCollection
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum
from django.db import transaction
from .wpm_milestones import DEFAULT_WPM_LIMIT

from dj_rest_auth.serializers import UserDetailsSerializer


User = get_user_model()

class CustomUserDetailsSerializer(UserDetailsSerializer):
    has_usable_password = serializers.SerializerMethodField()
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta(UserDetailsSerializer.Meta):
        fields = UserDetailsSerializer.Meta.fields + ('avatar', 'has_usable_password')
        read_only_fields = ('email', 'has_usable_password')

    def get_has_usable_password(self, obj):
        return obj.has_usable_password()


class BasicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class UserStatusSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()
    max_wpm_limit = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'is_staff', 'is_superuser', 'is_admin', 
            'current_streak', 'max_streak',
            'max_wpm_limit',
            'has_completed_calibration'
        ]

    def get_is_admin(self, obj):
        return obj.is_staff or obj.is_superuser


class FriendActivitySerializer(serializers.ModelSerializer):
    user = BasicUserSerializer(read_only=True)
    exercise_title = serializers.CharField(source='exercise.title', read_only=True)

    class Meta:
        model = UserProgress
        fields = [
            'id', 
            'user',        
            'exercise_title',   
            'wpm',        
            'accuracy',        
            'ranking_points',   
            'completed_at',   
            'completed_daily_challenge' 
        ]


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        max_wpm_limit = serializers.IntegerField(read_only=True)
        fields = ['speed', 'muted', 'mode', 'highlight_width', 'highlight_height', 'chunk_size', 'max_wpm_limit']
    def validate_speed(self, value_ms):
        """
        Sprawdza, czy ustawiana prędkość (w MS) jest dozwolona.
        """
        user = self.instance 
        
        if not user:
            return value_ms

        max_wpm = user.max_wpm_limit
        
        if max_wpm <= 0:
            max_wpm = DEFAULT_WPM_LIMIT
            
        if max_wpm >= 1500:
            min_ms_allowed = 40
        else:
            min_ms_allowed = 60000 / max_wpm

        if value_ms < (min_ms_allowed - 1):
            raise serializers.ValidationError(
                f"Nie możesz ustawić prędkości wyższej niż Twój limit ({max_wpm} WPM). "
                f"Ukończ ćwiczenie rankingowe na poziomie {max_wpm} WPM (lub wyższym) z trafnością >60%, aby odblokować kolejny poziom."
            )
        
        return value_ms    
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

    def validate(self, attrs):
        data = super().validate(attrs)
        
        refresh = self.get_token(self.user)

        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email
        }
        
        return data
    
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
    
    @transaction.atomic
    def update(self, instance, validated_data):
        questions_data = self.context['request'].data.get('questions')

        instance.title = validated_data.get('title', instance.title)
        instance.text = validated_data.get('text', instance.text)
        
        if self.context['request'].user.is_staff:
            instance.is_public = validated_data.get('is_public', instance.is_public)
            instance.is_ranked = validated_data.get('is_ranked', instance.is_ranked)
        
        instance.save() 
        if questions_data is not None:
            instance.questions.all().delete()
            for question_data in questions_data:
                question_data.pop('id', None) 
                Question.objects.create(exercise=instance, **question_data)

        return instance
    
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
    
class NotificationSerializer(serializers.ModelSerializer):
    actor = BasicUserSerializer(read_only=True) 

    class Meta:
        model = Notification
        fields = ['id', 'actor', 'verb', 'read', 'created_at']