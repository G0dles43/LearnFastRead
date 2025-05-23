from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    speed = models.IntegerField(default=200)  
    muted = models.BooleanField(default=False)


class ReadingExercise(models.Model):
    title = models.CharField(max_length=100)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_favorite = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    is_ranked = models.BooleanField(default=False)
    created_by = models.ForeignKey(  
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True
    )
    def __str__(self):
        return self.title
    
class Question(models.Model):
    exercise = models.ForeignKey(ReadingExercise, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    correct_answer = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pytanie do: {self.exercise.title}"


class UserProgress(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    exercise = models.ForeignKey(ReadingExercise, on_delete=models.CASCADE)
    wpm = models.IntegerField()
    accuracy = models.FloatField()
    completed_at = models.DateTimeField(auto_now_add=True)