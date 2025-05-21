from django.shortcuts import render
from rest_framework import generics
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from .models import ReadingExercise, UserProgress
from .serializers import ReadingExerciseSerializer, UserProgressSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class ReadingExerciseList(generics.ListAPIView):
    queryset = ReadingExercise.objects.all()
    serializer_class = ReadingExerciseSerializer

class SubmitProgress(generics.CreateAPIView):
    serializer_class = UserProgressSerializer