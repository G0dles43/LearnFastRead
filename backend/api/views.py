from django.shortcuts import render
from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from .models import ReadingExercise, Question
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, serializers
from .serializers import QuestionSerializer, ReadingExerciseSerializer, UserSettingsSerializer, UserProgressSerializer
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

class ReadingExerciseDelete(generics.DestroyAPIView):
    queryset = ReadingExercise.objects.all()
    serializer_class = ReadingExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ReadingExercise.objects.filter(created_by=self.request.user)


class SubmitProgress(generics.CreateAPIView):
    serializer_class = UserProgressSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        exercise = serializer.validated_data['exercise']
        if not exercise.is_ranked:
            raise serializers.ValidationError("Postęp tylko dla ćwiczeń ranked.")
        
        # Zapisz wynik (model automatycznie obsłuży counted_for_ranking)
        progress = serializer.save()
        
        return Response({
            'wpm': progress.wpm,
            'accuracy': progress.accuracy,
            'ranking_points': progress.ranking_points,
            'counted_for_ranking': progress.counted_for_ranking,
            'attempt_number': progress.attempt_number,
            'message': 'Wynik zaliczony do rankingu!' if progress.counted_for_ranking else 'Wynik zapisany (trening - nie liczy się do rankingu)'
        })


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


# NOWY ENDPOINT - Status użytkownika
class UserStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_admin': user.is_staff or user.is_superuser
        })


class SearchExercises(APIView):
    def get(self, request):
        query = request.GET.get('query', '')
        limit = int(request.GET.get('limit', 500))  
        
        if not query:
            return Response({"results": []})

      
        headers = {
            'User-Agent': 'SpeedReadingApp/1.0 (ziomekdfd@gmail.com)'  
        }

        try:
            search_url = "https://pl.wikipedia.org/w/api.php"
            search_params = {
                'action': 'query',
                'format': 'json',
                'list': 'search',
                'srsearch': query,
                'utf8': 1,
                'srlimit': 5,
            }
            
            search_response = requests.get(search_url, params=search_params, headers=headers, timeout=10)
            search_response.raise_for_status()
            search_data = search_response.json()

            results = []

            for item in search_data.get('query', {}).get('search', []):
                pageid = item['pageid']
                title = item['title']

                # Pobierz pełny tekst
                extract_params = {
                    'action': 'query',
                    'format': 'json',
                    'prop': 'extracts',
                    'explaintext': 1,
                    'pageids': pageid,
                    'utf8': 1,
                }
                
                extract_response = requests.get(search_url, params=extract_params, headers=headers, timeout=10)
                extract_response.raise_for_status()
                extract_data = extract_response.json()

                page = extract_data['query']['pages'].get(str(pageid), {})
                full_text = page.get('extract', '')

                if not full_text:
                    continue

                # Czyszczenie tekstu
                clean_text = re.sub(r'\s+', ' ', full_text)
                clean_text = clean_text.strip()
                
                # Obetnij do limitu słów
                words = clean_text.split()
                truncated = " ".join(words[:limit])

                results.append({
                    "title": title,
                    "snippet": truncated,
                })

            return Response({"results": results})
            
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Błąd połączenia z Wikipedia: {str(e)}"}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {"error": f"Nieoczekiwany błąd: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class ReadingExerciseDetail(generics.RetrieveAPIView):
    queryset = ReadingExercise.objects.all()
    serializer_class = ReadingExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]  


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, pk):
    try:
        exercise = ReadingExercise.objects.get(pk=pk, created_by=request.user)
        exercise.is_favorite = not exercise.is_favorite
        exercise.save()
        return Response({"is_favorite": exercise.is_favorite})
    except ReadingExercise.DoesNotExist:
        return Response({"error": "Nie znaleziono ćwiczenia"}, status=404)
    
class QuestionListView(generics.ListAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        exercise_id = self.kwargs['exercise_id']
        return Question.objects.filter(exercise_id=exercise_id)