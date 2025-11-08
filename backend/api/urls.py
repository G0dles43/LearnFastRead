from django.urls import path
from .views import ( 
    NotificationListView,
    MarkAllNotificationsAsReadView, GoogleLoginView, MyStatsView, QuestionListView, ReadingExerciseRetrieveUpdateDestroyView, FriendActivityFeedView, UserSearchView, FollowingListView, FollowView, UnfollowView, FriendsLeaderboardView, generate_ai_questions, ExerciseAttemptStatusView, UserProgressHistoryView, TodayChallengeView, 
    UserAchievementsView, UserStatusView, toggle_favorite, LeaderboardView, 
    ReadingExerciseCreate, SearchExercises, UserSettingsView, RegisterView, 
    ReadingExerciseList, SubmitProgress, CollectionListView, CollectionDetailView
)
from .views import MyTokenObtainPairView  
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),   
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/mark-all-as-read/', MarkAllNotificationsAsReadView.as_view(), name='notifications-mark-all-read'),
    path('exercises/', ReadingExerciseList.as_view(), name='exercise-list'),
    path('exercises/create/', ReadingExerciseCreate.as_view(), name='exercise-create'),
    path('exercises/<int:pk>/', ReadingExerciseRetrieveUpdateDestroyView.as_view(), name='exercise-detail-update-delete'),
    path('exercises/search/', SearchExercises.as_view(), name='exercise-search'),
    path('submit-progress/', SubmitProgress.as_view(), name='submit-progress'),   
    path('exercises/<int:exercise_id>/questions/', QuestionListView.as_view(), name='exercise-questions'),
    
    path('exercises/<int:exercise_id>/attempt-status/', ExerciseAttemptStatusView.as_view(), name='exercise-attempt-status'), 

    path('user/settings/', UserSettingsView.as_view(), name='user-settings'),
    path('user/status/', UserStatusView.as_view(), name='user-status'),

    path('exercises/<int:pk>/favorite/', toggle_favorite, name='exercise-favorite'),

    path('ranking/leaderboard/', LeaderboardView.as_view(), name='ranking-leaderboard'),
    path('ranking/my-stats/', MyStatsView.as_view(), name='ranking-my-stats'),

    path('user/achievements/', UserAchievementsView.as_view(), name='user-achievements'),

    path('challenge/today/', TodayChallengeView.as_view(), name='today-challenge'),

    path('user/progress-history/', UserProgressHistoryView.as_view(), name='user-progress-history'),

    path('ai/generate-questions/', generate_ai_questions, name='ai-generate-questions'),

    path('collections/', CollectionListView.as_view(), name='collection-list'),
    path('collections/<slug:slug>/', CollectionDetailView.as_view(), name='collection-detail'),

    path('friends/feed/', FriendActivityFeedView.as_view(), name='friends-feed'),

    path('users/search/', UserSearchView.as_view(), name='user-search'),
    path('friends/following/', FollowingListView.as_view(), name='following-list'),
    path('friends/follow/', FollowView.as_view(), name='follow-user'),
    path('friends/unfollow/', UnfollowView.as_view(), name='unfollow-user'),
    path('ranking/leaderboard/friends/', FriendsLeaderboardView.as_view(), name='friends-leaderboard'),
]