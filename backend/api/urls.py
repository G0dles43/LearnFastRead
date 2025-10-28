from django.urls import path
from .views import UserProgressHistoryView, TodayChallengeView, UserAchievementsView, UserStatusView, toggle_favorite, LeaderboardView, MyStatsView, QuestionListView, ReadingExerciseDelete, ReadingExerciseDetail, ReadingExerciseCreate, SearchExercises, UserSettingsView, RegisterView, ReadingExerciseList, SubmitProgress
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('exercises/', ReadingExerciseList.as_view(), name='exercise-list'),
    path('exercises/create/', ReadingExerciseCreate.as_view(), name='exercise-create'),
    path('exercises/<int:pk>/', ReadingExerciseDetail.as_view(), name='exercise-detail'),
    path('exercises/<int:pk>/delete/', ReadingExerciseDelete.as_view(), name='exercise-delete'),
    path('exercises/search/', SearchExercises.as_view(), name='exercise-search'),
    path('submit-progress/', SubmitProgress.as_view(), name='submit-progress'),    
    path('exercises/<int:exercise_id>/questions/', QuestionListView.as_view(), name='exercise-questions'),

    path('user/settings/', UserSettingsView.as_view(), name='user-settings'),
    path('user/status/', UserStatusView.as_view(), name='user-status'),

    path('exercises/<int:pk>/favorite/', toggle_favorite, name='exercise-favorite'),

    path('ranking/leaderboard/', LeaderboardView.as_view(), name='ranking-leaderboard'),
    path('ranking/my-stats/', MyStatsView.as_view(), name='ranking-my-stats'),

    path('user/achievements/', UserAchievementsView.as_view(), name='user-achievements'),

    path('challenge/today/', TodayChallengeView.as_view(), name='today-challenge'),

    path('user/progress-history/', UserProgressHistoryView.as_view(), name='user-progress-history'),
]