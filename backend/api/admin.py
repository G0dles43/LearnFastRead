from django.contrib import admin

from .models import ReadingExercise, UserProgress, CustomUser

admin.site.register(ReadingExercise)
admin.site.register(UserProgress)
