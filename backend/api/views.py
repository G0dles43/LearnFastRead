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
import requests
import re
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
    
import requests
import re
from rest_framework.response import Response
from rest_framework.views import APIView

class SearchExercises(APIView):
    def get(self, request):
        query = request.GET.get('query', '')
        limit = int(request.GET.get('limit', 500))  # ilość słów
        if not query:
            return Response({"results": []})

        search_url = "https://pl.wikipedia.org/w/api.php"
        search_params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': query,
            'srlanguage': 'pl',
            'utf8': 1,
            'srlimit': 5,
        }
        search_response = requests.get(search_url, params=search_params)
        search_data = search_response.json()

        results = []

        for item in search_data.get('query', {}).get('search', []):
            pageid = item['pageid']
            title = item['title']

            extract_url = "https://pl.wikipedia.org/w/api.php"
            extract_params = {
                'action': 'query',
                'format': 'json',
                'prop': 'extracts',
                'explaintext': 1,
                'pageids': pageid,
                'utf8': 1,
            }
            extract_response = requests.get(extract_url, params=extract_params)
            extract_data = extract_response.json()

            page = extract_data['query']['pages'].get(str(pageid), {})
            full_text = page.get('extract', '')

            clean_text = re.sub(r'<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]', '', full_text)
            clean_text = clean_text.replace('&quot;', '"').replace('&amp;', '&')
            words = clean_text.strip().split()
            truncated = " ".join(words[:limit])

            results.append({
                "title": title,
                "snippet": truncated,
            })

        return Response({"results": results})




class ReadingExerciseDetail(generics.RetrieveAPIView):
    queryset = ReadingExercise.objects.all()
    serializer_class = ReadingExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]  
