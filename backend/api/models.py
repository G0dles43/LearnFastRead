from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    speed = models.IntegerField(default=200)  
    muted = models.BooleanField(default=False)

class ReadingExercise(models.Model):
    title = models.CharField(max_length=100)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(  
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True
    )

class UserProgress(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    exercise = models.ForeignKey(ReadingExercise, on_delete=models.CASCADE)
    wpm = models.IntegerField()
    accuracy = models.FloatField()
    completed_at = models.DateTimeField(auto_now_add=True)