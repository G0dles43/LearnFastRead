FROM python:3.11-slim

# Zmienne środowiskowe
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instalacja zależności systemowych
# Dodano 'libpq-dev' (wymagane dla PostgreSQL w chmurze)
RUN apt-get update && apt-get install -y \
    gcc \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Kopiowanie i instalacja bibliotek
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiowanie kodu
COPY . .

# Opcjonalnie: Zebranie plików statycznych (jeśli używasz WhiteNoise)
# RUN python manage.py collectstatic --noinput

# --- ZMIANA KLUCZOWA DLA CLOUD RUN ---
# 1. Używamy 'gunicorn' (serwer produkcyjny).
# 2. Nasłuchujemy na porcie 8080 (wymagane przez Google).
# 3. Wskazujemy na aplikację 'backend.wsgi:application'.
CMD exec gunicorn --bind 0.0.0.0:8080 --workers 1 --threads 8 --timeout 0 backend.wsgi:application