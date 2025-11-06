from django.shortcuts import render
from rest_framework import generics, permissions
from .permissions import IsOwnerOrAdminOrReadOnly
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from .models import Friendship, ReadingExercise, Question, UserProgress, UserAchievement, ExerciseCollection
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from .services import get_today_challenge
from .serializers import FriendActivitySerializer, BasicUserSerializer, ExerciseCollectionSerializer, UserStatusSerializer, UserAchievementSerializer, QuestionSerializer, ReadingExerciseSerializer, UserSettingsSerializer, UserProgressSerializer
import requests
import re
import os
import json
import random  
import google.generativeai as genai
from rest_framework.exceptions import PermissionDenied
from dotenv import load_dotenv
from django.db.models import F, Window, Q
from django.db.models.functions import Rank
from .models import CustomUser
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404

User = get_user_model()

try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    gemini_model = genai.GenerativeModel('gemini-2.0-flash')
except Exception as e:
    print(f"BŁĄD KRYTYCZNY: Nie udało się skonfigurować Gemini API. Sprawdź klucz API. Błąd: {e}")
    gemini_model = None

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class ReadingExerciseList(generics.ListAPIView):
    serializer_class = ReadingExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
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
            queryset = queryset.filter(favorited_by=user) 

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

        return queryset.distinct()

class ReadingExerciseCreate(generics.CreateAPIView):
    queryset = ReadingExercise.objects.all()
    serializer_class = ReadingExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ReadingExerciseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    API do pobierania, aktualizowania i usuwania ćwiczeń.
    - Każdy zalogowany może CZYTAĆ (GET).
    - Tylko WŁAŚCICIEL lub ADMIN może EDYTOWAĆ (PUT/PATCH) i USUWAĆ (DELETE).
    """
    queryset = ReadingExercise.objects.all().prefetch_related('questions')
    serializer_class = ReadingExerciseSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdminOrReadOnly]
    
    def get_serializer_context(self):
        return {'request': self.request}


class SubmitProgress(APIView):
    """
    Endpoint do zapisu postępu.
    ZWRACA: dokładnie te same dane, które są zapisane w bazie.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        
        try:
            exercise_id = data.get('exercise')
            reading_time_ms = data.get('reading_time_ms')
            answers = data.get('answers')

            if not all([exercise_id, reading_time_ms is not None]):
                return Response(
                    {"error": "Brakujące dane: exercise_id lub reading_time_ms."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            exercise = ReadingExercise.objects.get(pk=exercise_id)
            
            if reading_time_ms <= 0: 
                return Response(
                    {"error": "Nieprawidłowy czas czytania"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            minutes = reading_time_ms / 60000.0
            wpm = round(exercise.word_count / minutes)

            accuracy = 0.0

            if exercise.is_ranked:
                if answers is None:
                     return Response(
                        {"error": "Brak 'answers' dla ćwiczenia rankingowego."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                correct_questions = Question.objects.filter(exercise=exercise)
                total_questions_count = correct_questions.count()
                
                if total_questions_count > 0:
                    correct_answers_count = 0
                    for question in correct_questions:
                        user_answer = answers.get(str(question.id))
                        
                        if user_answer and isinstance(user_answer, str):
                            if user_answer.strip().lower() == question.correct_answer.strip().lower():
                                correct_answers_count += 1
                    
                    accuracy = round((correct_answers_count / total_questions_count) * 100, 2)

            progress = UserProgress(
                user=user,
                exercise=exercise,
                wpm=wpm,
                accuracy=accuracy
            )
            progress.save()

            response_data = {
                'wpm': progress.wpm,  # To co zapisane w bazie
                'accuracy': progress.accuracy,  # To co zapisane w bazie
                'ranking_points': progress.ranking_points,  # 0 jeśli < 60%
                'counted_for_ranking': progress.counted_for_ranking,
                'attempt_number': progress.attempt_number,
            }

            if exercise.is_ranked:
                if progress.counted_for_ranking:
                    response_data['message'] = 'Wynik zaliczony do rankingu!'
                else:
                    response_data['message'] = 'Wynik zapisany (trening - nie liczy się do rankingu)'
            else:
                response_data['message'] = f'Trening ukończony! Seria zaktualizowana. (WPM: {progress.wpm})'

            return Response(response_data, status=status.HTTP_201_CREATED)

        except ReadingExercise.DoesNotExist:
            return Response(
                {"error": "Nie znaleziono ćwiczenia"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Błąd w SubmitProgress: {e}") 
            return Response(
                {"error": "Wystąpił wewnętrzny błąd serwera."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
    """
    Zwraca kluczowe dane użytkownika, w tym status admina i serię (streak).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserStatusSerializer(user)
        return Response(serializer.data)


class SearchExercises(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        query = self.request.query_params.get('query', '')

        if not query:
            return Response({"results": []})

        try:
            num_results = int(self.request.query_params.get('num_results', 5))
            if not 1 <= num_results <= 20:
                num_results = 5
        except ValueError:
            num_results = 5 

        try:
            limit = int(self.request.query_params.get('limit', 300))
            if not 100 <= limit <= 1000: 
                limit = 300
        except ValueError:
            limit = 300

        headers = { 'User-Agent': 'SpeedReadingApp/1.0 (ziomekdfd@gmail.com)' } 

        try:
            search_url = "https://pl.wikipedia.org/w/api.php"
            
            search_params = {
                'action': 'query', 'format': 'json', 'list': 'search',
                'srsearch': query, 'utf8': 1, 'srlimit': num_results,
            }

            search_response = requests.get(search_url, params=search_params, headers=headers, timeout=15)
            search_response.raise_for_status()
            search_data = search_response.json()

            results = []
            wiki_search_results = search_data.get('query', {}).get('search', [])

            if not wiki_search_results:
                return Response({"results": [], "message": "Wikipedia nie znalazła wyników dla tego zapytania."})

            for item in wiki_search_results:
                pageid = item['pageid']
                title = item['title']

                extract_params = {
                    'action': 'query', 'format': 'json', 'prop': 'extracts',
                    'explaintext': 1, 'pageids': pageid, 'utf8': 1,
                }

                extract_response = requests.get(search_url, params=extract_params, headers=headers, timeout=15)
                extract_response.raise_for_status()
                extract_data = extract_response.json()

                page = extract_data.get('query', {}).get('pages', {}).get(str(pageid), {})
                full_text = page.get('extract', '')

                if not full_text: continue

                cleaned_text = re.sub(r'[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ]', '', full_text, flags=re.UNICODE)
                cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()

                if not cleaned_text: continue

                words = cleaned_text.split()
                truncated_text = " ".join(words[:limit])

                results.append({
                    "title": title,
                    "snippet": truncated_text, 
                })

            return Response({"results": results})

        except requests.exceptions.Timeout:
            return Response({"error": "Przekroczono limit czasu połączenia z Wikipedią."}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except requests.exceptions.RequestException as e:
            return Response({"error": f"Błąd połączenia z Wikipedia: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            print(f"Błąd w SearchExercises: {e}") 
            return Response({"error": "Wystąpił nieoczekiwany błąd serwera."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

    
# --- POPRAWIONA SEKCJA QuestionListView ---
class QuestionListView(generics.ListAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        exercise_id = self.kwargs['exercise_id']
        
        try:
            exercise = ReadingExercise.objects.get(pk=exercise_id)
        except ReadingExercise.DoesNotExist:
            return Question.objects.none()

        all_questions = Question.objects.filter(exercise=exercise)
        
        num_to_sample = exercise.get_recommended_questions()

        question_list = list(all_questions)
        
        if len(question_list) <= num_to_sample:
            return question_list

        return random.sample(question_list, num_to_sample)


class LeaderboardView(APIView):
    """
    RANKING GLOBALNY
    Pokazuje średnie z ZALICZONYCH prób (accuracy >= 60%, ranking_points > 0)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Window
        from django.db.models.functions import Rank
        
        ranked_users_query = CustomUser.objects.annotate(
            rank=Window(
                expression=Rank(),
                order_by=F('total_ranking_points').desc()
            )
        ).filter(
            total_ranking_points__gt=0
        ).order_by('rank')

        leaderboard_data = []
        for user in ranked_users_query:
            leaderboard_data.append({
                'id': user.id,
                'rank': user.rank,
                'username': user.username,
                'total_points': user.total_ranking_points,  # Suma punktów z ZALICZONYCH
                'average_wpm': round(user.average_wpm),  # Średnie WPM z ZALICZONYCH
                'average_accuracy': round(user.average_accuracy, 1),  # Średnie accuracy z ZALICZONYCH
                'exercises_completed': user.ranking_exercises_completed,  # Liczba ZALICZONYCH prób
            })

        return Response({"leaderboard": leaderboard_data})


class MyStatsView(APIView):
    """
    MOJE STATYSTYKI
    Pokazuje średnie z ZALICZONYCH prób (accuracy >= 60%, ranking_points > 0)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from django.db.models import Window
        from django.db.models.functions import Rank

        # Znajdź rangę użytkownika
        user_rank_data = CustomUser.objects.annotate(
            rank=Window(
                expression=Rank(),
                order_by=F('total_ranking_points').desc()
            )
        ).filter(id=user.id).values('rank', 'total_ranking_points').first()

        user_rank = user_rank_data['rank'] if user_rank_data else 0
        
        if user_rank_data and user_rank_data['total_ranking_points'] == 0:
            user_rank = "N/A"

        # Pobierz ostatnie ZALICZONE wyniki
        recent_results_query = UserProgress.objects.filter(
            user=user,
            counted_for_ranking=True,
            ranking_points__gt=0  # Tylko zaliczone (>= 60%)
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
            'total_points': user.total_ranking_points,  # Suma punktów z ZALICZONYCH
            'average_wpm': round(user.average_wpm),  # Średnie WPM z ZALICZONYCH
            'average_accuracy': round(user.average_accuracy, 1),  # Średnie accuracy z ZALICZONYCH
            'exercises_completed': user.ranking_exercises_completed,  # Liczba ZALICZONYCH prób
            'recent_results': recent_results_data  # Ostatnie ZALICZONE wyniki
        }

        return Response(stats)


class UserAchievementsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        unlocked_achievements = UserAchievement.objects.filter(user=user).order_by('-unlocked_at')
        serializer = UserAchievementSerializer(unlocked_achievements, many=True)
        return Response(serializer.data)

# --- POPRAWIONA SEKCJA ExerciseAttemptStatusView ---
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
                "is_training_mode": False, 
                "message": "To ćwiczenie nie jest rankingowe"
            })

        last_ranked = UserProgress.objects.filter(
            user=user,
            exercise=exercise,
            counted_for_ranking=True
        ).order_by('-completed_at').first()

        if not last_ranked:
            return Response({
                "can_rank": True,
                "is_training_mode": False,
                "message": "Pierwsze podejście - wynik będzie liczony do rankingu!"
            })

        one_month_ago = timezone.now() - timedelta(days=30)
        
        if last_ranked.completed_at >= one_month_ago:
            days_left = 30 - (timezone.now() - last_ranked.completed_at).days
            return Response({
                "can_rank": False,
                "is_training_mode": True,
                "message": f"Tryb treningowy - możesz poprawić wynik za {days_left} dni",
                "ranked_result": {
                    "wpm": last_ranked.wpm,
                    "accuracy": last_ranked.accuracy,
                    "points": last_ranked.ranking_points,
                    "completed_at": last_ranked.completed_at.isoformat()
                }
            })
        else:
            return Response({
                "can_rank": True,
                "is_training_mode": False,
                "message": "Możesz poprawić swój wynik rankingowy!",
                "ranked_result": {
                    "wpm": last_ranked.wpm,
                    "accuracy": last_ranked.accuracy,
                    "points": last_ranked.ranking_points,
                    "completed_at": last_ranked.completed_at.isoformat()
                }
            })
# --- KONIEC POPRAWIONEJ SEKCJI ---
    
class TodayChallengeView(APIView):
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        progress_history = UserProgress.objects.filter(
            user=user,
            counted_for_ranking=True 
        ).order_by('completed_at').values(
            'completed_at', 
            'wpm', 
            'accuracy'
        )
        data = list(progress_history)
        return Response(data)
    
class CollectionListView(generics.ListCreateAPIView):
    """
    API do listowania i tworzenia kolekcji.
    Zwraca tylko kolekcje publiczne LUB własne danego użytkownika.
    """
    serializer_class = ExerciseCollectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ExerciseCollection.objects.filter(
            Q(is_public=True) | Q(created_by=user)
        ).distinct().prefetch_related('exercises') 

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_serializer_context(self):
        return {'request': self.request}

class CollectionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API do pobierania, edycji i usuwania JEDNEJ kolekcji.
    Używa 'slug' jako klucza wyszukiwania.
    """
    serializer_class = ExerciseCollectionSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug' 

    def get_queryset(self):
        user = self.request.user
        return ExerciseCollection.objects.filter(
            Q(is_public=True) | Q(created_by=user)
        ).distinct().prefetch_related('exercises')
    
    def get_serializer_context(self):
        return {'request': self.request}

    def perform_update(self, serializer):
        collection = self.get_object()
        if collection.created_by != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("Możesz edytować tylko własne kolekcje.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.created_by != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("Możesz usuwać tylko własne kolekcje.")
        instance.delete()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_ai_questions(request):
    """
    Endpoint do generowania pytań z tekstu przy użyciu Gemini AI.
    """
    if not gemini_model:
        return Response(
            {"error": "Model AI nie jest dostępny lub nie został poprawnie skonfigurowany."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    if not request.user.is_staff:
         return Response(
            {"error": "Tylko administratorzy mogą generować pytania AI."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        content = request.data.get('content')
        topic = request.data.get('topic', 'Temat ogólny')
        count = int(request.data.get('count', 15))

        if not content or len(content) < 50:
            return Response(
                {"error": "Materiał źródłowy (content) jest wymagany i musi mieć co najmniej 50 znaków."},
                status=status.HTTP_400_BAD_REQUEST
            )

        prompt = f"""
        Jesteś asystentem edukacyjnym. Twoim zadaniem jest wygenerowanie {count} pytań otwartych
        z podanego materiału źródłowego. Odpowiedzi muszą być BARDZO KRÓTKIE (1-3 słowa).

        Pytania mają dotyczyć tematu: "{topic}".
        Zawsze zwracaj odpowiedź wyłącznie jako tablicę obiektów JSON, bez żadnego dodatkowego tekstu.
        Format JSON: [ {{ "question": "...", "answer": "..." }} ]

        Oto materiał źródłowy:
        ---
        {content}
        ---

        Oczekiwany JSON:
        """

        response = gemini_model.generate_content(prompt)
        ai_response_text = response.text

        cleaned_text = re.sub(r'```json\n|```', '', ai_response_text).strip()
        
        questions_json = json.loads(cleaned_text)

        return Response(questions_json, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        print(f"Błąd parsowania JSON od AI: {ai_response_text}")
        return Response({"error": "AI zwróciło niepoprawny format danych."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        print(f"Błąd w generate_ai_questions: {e}")
        return Response({"error": f"Wystąpił wewnętrzny błąd serwera: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class UserSearchView(generics.ListAPIView):
    """
    API do wyszukiwania użytkowników po nazwie.
    Przyjmuje parametr ?q=
    """
    serializer_class = BasicUserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('q', None)
        user = self.request.user
        
        if query:
            # Wyszukaj użytkowników pasujących do zapytania,
            # wykluczając samego siebie
            return CustomUser.objects.filter(
                username__icontains=query
            ).exclude(id=user.id).distinct()[:10] # Zwróć max 10 wyników
        
        # Jeśli nie ma query, zwróć pustą listę
        return CustomUser.objects.none()


class FollowingListView(APIView):
    """
    Zwraca listę ID użytkowników, których obserwuje zalogowany użytkownik.
    Potrzebne dla frontendu, aby wiedzieć, czy pokazać "Follow" czy "Unfollow".
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        following_ids = Friendship.objects.filter(
            follower=user
        ).values_list('followed_id', flat=True)
        return Response(list(following_ids))


class FollowView(APIView):
    """
    API do obserwowania użytkownika.
    Przyjmuje w body: { "user_id": ID_DO_OBSERWOWANIA }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        followed_id = request.data.get('user_id')
        follower = request.user
        
        if not followed_id:
            return Response(
                {"error": "Brak 'user_id' w zapytaniu."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if follower.id == followed_id:
             return Response(
                {"error": "Nie możesz obserwować samego siebie."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        followed_user = get_object_or_404(CustomUser, id=followed_id)
        
        # get_or_create zapobiega duplikatom i obsługuje unique_together
        friendship, created = Friendship.objects.get_or_create(
            follower=follower,
            followed=followed_user
        )
        
        if created:
            return Response(
                {"status": "followed", "user_id": followed_id},
                status=status.HTTP_201_CREATED
            )
        else:
            return Response(
                {"status": "already_following", "user_id": followed_id},
                status=status.HTTP_200_OK
            )


class UnfollowView(APIView):
    """
    API do przestania obserwowania użytkownika.
    Przyjmuje w body: { "user_id": ID_DO_ODSERWOWANIA }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        followed_id = request.data.get('user_id')
        follower = request.user

        if not followed_id:
            return Response(
                {"error": "Brak 'user_id' w zapytaniu."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        followed_user = get_object_or_404(CustomUser, id=followed_id)
        
        # Znajdź i usuń relację
        deleted_count, _ = Friendship.objects.filter(
            follower=follower,
            followed=followed_user
        ).delete()

        if deleted_count > 0:
            return Response(
                {"status": "unfollowed", "user_id": followed_id},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"status": "not_following", "user_id": followed_id},
                status=status.HTTP_404_NOT_FOUND
            )


class FriendsLeaderboardView(APIView):
    """
    RANKING ZNAJOMYCH
    Pokazuje średnie z ZALICZONYCH prób (accuracy >= 60%, ranking_points > 0)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from django.db.models import Window
        from django.db.models.functions import Rank
        
        user = request.user
        
        following_ids = list(Friendship.objects.filter(
            follower=user
        ).values_list('followed_id', flat=True))
        
        following_ids.append(user.id)
        
        ranked_users_query = CustomUser.objects.annotate(
            rank=Window(
                expression=Rank(),
                order_by=F('total_ranking_points').desc()
            )
        ).filter(
            total_ranking_points__gt=0,
            id__in=following_ids
        ).order_by('rank')
        
        leaderboard_data = []
        for user_data in ranked_users_query:
            leaderboard_data.append({
                'id': user_data.id,
                'rank': user_data.rank,
                'username': user_data.username,
                'total_points': user_data.total_ranking_points,  # Suma punktów z ZALICZONYCH
                'average_wpm': round(user_data.average_wpm),  # Średnie WPM z ZALICZONYCH
                'average_accuracy': round(user_data.average_accuracy, 1),  # Średnie accuracy z ZALICZONYCH
                'exercises_completed': user_data.ranking_exercises_completed,  # Liczba ZALICZONYCH prób
            })
            
        return Response({"leaderboard": leaderboard_data})

class FriendActivityFeedView(generics.ListAPIView):
    """
    Zwraca listę (Limit 15) ostatnich UDANYCH prób rankingowych od użytkowników,
    których obserwuje zalogowany użytkownik.
    """
    serializer_class = FriendActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        following_ids = Friendship.objects.filter(
            follower=user
        ).values_list('followed_id', flat=True)

        if not following_ids.exists():
            return UserProgress.objects.none()

        queryset = UserProgress.objects.filter(
            counted_for_ranking=True, 
            ranking_points__gt=0,    
            user_id__in=following_ids 
        ).select_related(
            'user', 'exercise' 
        ).order_by(
            '-completed_at'
        )[:15] 
        
        return queryset