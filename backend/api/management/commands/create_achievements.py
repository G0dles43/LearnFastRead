from django.core.management.base import BaseCommand
from api.models import Achievement

class Command(BaseCommand):
    help = 'Tworzy podstawowe osiągnięcia'

    def handle(self, *args, **kwargs):
        achievements_data = [
            {
                'slug': 'wpm_300',
                'title': 'Speedster',
                'description': 'Osiągnij prędkość 300 WPM',
                'icon_name': '⚡'
            },
            {
                'slug': 'wpm_800',
                'title': 'Supersonic',
                'description': 'Osiągnij prędkość 800 WPM',
                'icon_name': '🚀'
            },
            {
                'slug': 'accuracy_100',
                'title': 'Snajper',
                'description': 'Osiągnij 100% dokładności',
                'icon_name': '🎯'
            },
            {
                'slug': 'marathoner',
                'title': 'Maratończyk',
                'description': 'Ukończ tekst dłuższy niż 800 słów',
                'icon_name': '🏃'
            },
            {
                'slug': 'daily_challenger',
                'title': 'Bohater Dnia',
                'description': 'Ukończ wyzwanie dnia',
                'icon_name': '🔥'
            },
        ]

        for data in achievements_data:
            ach, created = Achievement.objects.get_or_create(
                slug=data['slug'],
                defaults={
                    'title': data['title'],
                    'description': data['description'],
                    'icon': data.get('icon', '🏆')
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Utworzono: {ach.title}'))
            else:
                self.stdout.write(self.style.WARNING(f'Już istnieje: {ach.title}'))