from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UserAchievement, Achievement, Question, ReadingExercise, UserProgress, CustomUser

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1

@admin.register(ReadingExercise)
class ReadingExerciseAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_by', 'is_public', 'is_ranked']
    fields = ['title', 'text', 'created_by', 'is_public', 'is_ranked']
    readonly_fields = ['created_by']
    inlines = [QuestionInline]

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    Używamy UserAdmin, aby zachować całą logikę
    zarządzania hasłami, uprawnieniami itp.
    Dodajemy nasze własne pola do widoku admina.
    """
    list_display = ('username', 'email', 'is_staff', 'total_ranking_points', 'current_streak')
    
    search_fields = ('username', 'email')
    
    # KLUCZOWA ZMIANA: Dodano pole 'avatar' do fieldsets
    fieldsets = UserAdmin.fieldsets + (
        ('Profil', {
            'fields': ('avatar',),  # Osobna sekcja dla avatara
        }),
        ('Statystyki i Ustawienia FastReader', {
            'fields': (
                'speed', 'muted', 'mode', 'chunk_size', 'highlight_width', 'highlight_height',
                'total_ranking_points', 'ranking_exercises_completed', 
                'average_wpm', 'average_accuracy',
                'current_streak', 'max_streak', 'last_streak_date'
            ),
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {
            'fields': (
                'email', 'avatar', 'speed', 'mode'  # Dodano avatar
            ),
        }),
    )


admin.site.register(UserProgress)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('slug', 'title', 'description', 'icon_name')

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'unlocked_at')
    list_filter = ('achievement',)