from django.contrib import admin

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

admin.site.register(CustomUser)
admin.site.register(UserProgress)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('slug', 'title', 'description', 'icon_name')

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'unlocked_at')
    list_filter = ('achievement',)