from django.shortcuts import render
from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from .models import ReadingExercise, Question, UserProgress, UserAchievement
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, serializers
from .services import get_today_challenge
from .serializers import UserAchievementSerializer, QuestionSerializer, ReadingExerciseSerializer, UserSettingsSerializer, UserProgressSerializer
import requests
import re
from django.db.models import Q
from django.db.models import F, Window
from django.db.models.functions import Rank
from .models import CustomUser
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class ReadingExerciseList(generics.ListAPIView):
    serializer_class = ReadingExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Zwraca listę ćwiczeń z uwzględnieniem filtrowania i sortowania.
        Admin widzi wszystko. Zwykły user widzi publiczne + swoje prywatne.
        """
        user = self.request.user

        if user.is_staff:
            queryset = ReadingExercise.objects.all()
        else:
            queryset = ReadingExercise.objects.filter(
                Q(is_public=True) | Q(created_by=user)
            )

        show_only_my_private = self.request.query_params.get('my_private')
        if show_only_my_private == 'true':
             queryset = ReadingExercise.objects.filter(created_by=user, is_public=False)

        show_favorites = self.request.query_params.get('favorites')
        if show_favorites == 'true':
            queryset = queryset.filter(favorited_by=user) # Filtruj wg relacji M2M

        show_ranked = self.request.query_params.get('ranked')
        if show_ranked == 'true':
            queryset = queryset.filter(is_ranked=True)

        show_public = self.request.query_params.get('public')
        if show_public == 'true':
            queryset = queryset.filter(is_public=True)


        sort_by = self.request.query_params.get('sort_by')

        if sort_by == 'title_asc':
            queryset = queryset.order_by('title')
        elif sort_by == 'title_desc':
            queryset = queryset.order_by('-title')
        elif sort_by == 'word_count_asc':
             queryset = queryset.order_by('word_count')
        elif sort_by == 'word_count_desc':
            queryset = queryset.order_by('-word_count')
        elif sort_by == 'created_at_asc':
            queryset = queryset.order_by('created_at')
        else:
            queryset = queryset.order_by('-created_at')

        # Zwróć unikalne wyniki (ważne przy filtrowaniu M2M)
        return queryset.distinct()

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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        exercise = serializer.validated_data['exercise']
        
        if not exercise.is_ranked:
            return Response(
                {"error": "Postęp tylko dla ćwiczeń ranked."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Zapisz wynik (model automatycznie obsłuży counted_for_ranking)
        progress = serializer.save()
        
        return Response({
            'wpm': progress.wpm,
            'accuracy': progress.accuracy,
            'ranking_points': progress.ranking_points,
            'counted_for_ranking': progress.counted_for_ranking,
            'attempt_number': progress.attempt_number,
            'message': 'Wynik zaliczony do rankingu!' if progress.counted_for_ranking else 'Wynik zapisany (trening - nie liczy się do rankingu)'
        }, status=status.HTTP_201_CREATED)


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

                clean_text = re.sub(r'\s+', ' ', full_text)
                clean_text = clean_text.strip()
                
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
        exercise = ReadingExercise.objects.get(pk=pk)
        
        if request.user in exercise.favorited_by.all():
            exercise.favorited_by.remove(request.user)
            is_favorite = False
        else:
            exercise.favorited_by.add(request.user)
            is_favorite = True
        
        return Response({"is_favorite": is_favorite})
        
    except ReadingExercise.DoesNotExist:
        return Response({"error": "Nie znaleziono ćwiczenia"}, status=404)

    
class QuestionListView(generics.ListAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        exercise_id = self.kwargs['exercise_id']
        return Question.objects.filter(exercise_id=exercise_id)


class LeaderboardView(APIView):
    """
    Zwraca globalną tabelę wyników.
    Dane są pobierane bezpośrednio z modelu CustomUser, 
    gdzie są aktualizowane przez UserProgress.save().
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Użyj Window function (funkcji okna), aby dodać ranking
        ranked_users_query = CustomUser.objects.annotate(
            # Stwórz ranking na podstawie punktów (malejąco)
            rank=Window(
                expression=Rank(),
                order_by=F('total_ranking_points').desc()
            )
        ).filter(
            # 2. Pokaż tylko użytkowników, którzy mają jakiekolwiek punkty
            total_ranking_points__gt=0
        ).order_by(
            # 3. Posortuj listę według rankingu
            'rank'
        ).values(
            # 4. Wybierz tylko te pola, które są potrzebne
            'rank',
            'username',
            'total_ranking_points',
            'average_wpm',
            'average_accuracy',
            'ranking_exercises_completed'
        )

        # Formatowanie danych dla frontendu
        leaderboard_data = []
        for user_data in ranked_users_query:
            leaderboard_data.append({
                'rank': user_data['rank'],
                'username': user_data['username'],
                'total_points': user_data['total_ranking_points'],
                # Zaokrąglenie dla ładniejszego wyświetlania
                'average_wpm': round(user_data['average_wpm']),
                'average_accuracy': round(user_data['average_accuracy'], 1),
                'exercises_completed': user_data['ranking_exercises_completed'],
            })

        return Response({"leaderboard": leaderboard_data})


class MyStatsView(APIView):
    """
    Zwraca szczegółowe statystyki zalogowanego użytkownika
    oraz jego ostatnie próby rankingowe.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        user_rank_data = CustomUser.objects.annotate(
            rank=Window(
                expression=Rank(),
                order_by=F('total_ranking_points').desc()
            )
        ).filter(
            id=user.id
        ).values('rank', 'total_ranking_points').first()

        user_rank = user_rank_data['rank'] if user_rank_data else 0
        
        if user_rank_data and user_rank_data['total_ranking_points'] == 0:
             user_rank = "N/A" # Lub 0, zależy jak chcesz to pokazać

        recent_results_query = UserProgress.objects.filter(
            user=user,
            counted_for_ranking=True
        ).order_by('-completed_at')[:10]

        recent_results_data = []
        for result in recent_results_query:
            recent_results_data.append({
                'exercise_title': result.exercise.title,
                'completed_at': result.completed_at,
                'wpm': result.wpm,
                'accuracy': result.accuracy,
                'points': result.ranking_points
            })

        stats = {
            'rank': user_rank,
            'total_points': user.total_ranking_points,
            'average_wpm': round(user.average_wpm),
            'average_accuracy': round(user.average_accuracy, 1),
            'exercises_completed': user.ranking_exercises_completed,
            'recent_results': recent_results_data
        }

        return Response(stats)

class UserAchievementsView(APIView):
    """
    Zwraca listę osiągnięć zdobytych przez zalogowanego użytkownika.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        unlocked_achievements = UserAchievement.objects.filter(user=user).order_by('-unlocked_at')
        serializer = UserAchievementSerializer(unlocked_achievements, many=True)
        return Response(serializer.data)

class ExerciseAttemptStatusView(APIView):
    """
    Sprawdź czy użytkownik może zdobyć punkty rankingowe dla danego ćwiczenia
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, exercise_id):
        user = request.user
        
        try:
            exercise = ReadingExercise.objects.get(pk=exercise_id)
        except ReadingExercise.DoesNotExist:
            return Response(
                {"error": "Ćwiczenie nie istnieje"},
                status=status.HTTP_404_NOT_FOUND
            )

        if not exercise.is_ranked:
            return Response({
                "can_rank": False,
                "message": "To ćwiczenie nie jest rankingowe"
            })

        # Sprawdź ostatni wynik rankingowy
        one_month_ago = timezone.now() - timedelta(days=30)
        last_ranked = UserProgress.objects.filter(
            user=user,
            exercise=exercise,
            counted_for_ranking=True,
            completed_at__gte=one_month_ago
        ).first()

        if last_ranked:
            days_left = 30 - (timezone.now() - last_ranked.completed_at).days
            return Response({
                "can_rank": False,
                "message": f"Możesz poprawić wynik rankingowy za {days_left} dni",
                "ranked_result": {
                    "wpm": last_ranked.wpm,
                    "accuracy": last_ranked.accuracy,
                    "points": last_ranked.ranking_points,
                    "completed_at": last_ranked.completed_at.isoformat()
                }
            })

        return Response({
            "can_rank": True,
            "message": "Ten wynik będzie liczony do rankingu!"
        })
    
class TodayChallengeView(APIView):
    """
    Zwraca dzisiejsze wyzwanie (ćwiczenie) oraz status,
    czy zalogowany użytkownik już je dzisiaj ukończył.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        challenge = get_today_challenge()
        
        if not challenge:
            return Response({"error": "Brak dostępnych wyzwań dnia."}, status=status.HTTP_404_NOT_FOUND)
            
        today_start = timezone.now().replace(hour=0, minute=0, second=0)
        today_end = timezone.now().replace(hour=23, minute=59, second=59)
        
        is_completed = UserProgress.objects.filter(
            user=request.user,
            exercise=challenge,
            completed_daily_challenge=True, 
            completed_at__gte=today_start,
            completed_at__lte=today_end
        ).exists()
        
        serializer = ReadingExerciseSerializer(challenge, context={'request': request})
        challenge_data = serializer.data  

        return Response({
            "challenge": challenge_data,
            "is_completed": is_completed
        })   
    
class UserProgressHistoryView(APIView):
    """
    Zwraca historię wszystkich wyników rankingowych użytkownika
    dla potrzeb wykresów.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Pobierz wszystkie rekordy rankingowe, posortowane od najstarszego
        # Wybieramy tylko potrzebne pola za pomocą .values() dla wydajności
        progress_history = UserProgress.objects.filter(
            user=user,
            counted_for_ranking=True # Tylko wyniki rankingowe
        ).order_by('completed_at').values( # Sortuj od najstarszego
            'completed_at', 
            'wpm', 
            'accuracy'
        )

        # Konwertuj QuerySet na listę słowników (gotowe do JSON)
        data = list(progress_history)

        return Response(data)