from django.shortcuts import render
from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from .models import ReadingExercise, UserProgress
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import ReadingExerciseSerializer, UserSettingsSerializer, UserProgressSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class ReadingExerciseList(generics.ListAPIView):
    queryset = ReadingExercise.objects.all()
    serializer_class = ReadingExerciseSerializer

class ReadingExerciseCreate(generics.CreateAPIView):
    queryset = ReadingExercise.objects.all()
    serializer_class = ReadingExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SubmitProgress(generics.CreateAPIView):
    serializer_class = UserProgressSerializer

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSettingsSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSettingsSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class SearchExercises(APIView):
    def get(self, request):
        query = request.GET.get('query', '')
        if not query:
            return Response({"results": []})

        url = "https://pl.wikipedia.org/w/api.php?"
        params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': query,
            'utf8': 1,
            'srlimit': 5,
        }
        response = requests.get(url, params=params)
        data = response.json()
        results = []
        for item in data.get('query', {}).get('search', []):
            snippet = item['snippet'].replace('<span class="searchmatch">', '').replace('</span>', '')
            results.append({
                "title": item['title'],
                "snippet": snippet,
            })
        return Response({"results": results})