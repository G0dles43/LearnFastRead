import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RSVPReader from "../reader/RSVPReader.jsx";
import { getDynamicDelay } from "../../utils/readingUtils.js";

const msToWpm = (ms) => Math.round(60000 / ms);
const wpmToMs = (wpm) => Math.round(60000 / wpm);

const CALIBRATION_TEXT_ID = 18;
const WPM_STEP = 5;
const DEFAULT_MAX_WPM = 1500; // Używane tylko jako fallback

export default function CalibrationSession() {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [currentWpm, setCurrentWpm] = useState(250); // Zostanie nadpisane po załadowaniu
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  
  // NOWOŚĆ: Stan do przechowywania maksymalnego limitu WPM użytkownika
  const [maxWpm, setMaxWpm] = useState(DEFAULT_MAX_WPM);

  const timerRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const speedMsRef = useRef(wpmToMs(currentWpm));

  // ZMIANA: Ten useEffect wczytuje teraz zarówno tekst, jak i ustawienia użytkownika
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchText = axios.get(`http://127.0.0.1:8000/api/exercises/${CALIBRATION_TEXT_ID}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // NOWOŚĆ: Pobieramy ustawienia użytkownika, aby poznać jego limit WPM
    const fetchSettings = axios.get("http://127.0.0.1:8000/api/user/settings/", {
      headers: { Authorization: `Bearer ${token}` }
    });

    Promise.all([fetchText, fetchSettings])
      .then(([textRes, settingsRes]) => {
        // 1. Przetwarzanie tekstu (jak wcześniej)
        const cleanText = textRes.data.text
          .replace(/<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        setWords(cleanText.split(/\s+/));

        // 2. NOWOŚĆ: Przetwarzanie ustawień
        const userSettings = settingsRes.data;
        const userMaxWpm = userSettings.max_wpm_limit || DEFAULT_MAX_WPM;
        const savedSpeedMs = userSettings.speed;
        
        // Ustawiamy maksymalny limit WPM
        setMaxWpm(userMaxWpm);

        // Ustawiamy początkowe WPM na podstawie zapisanego tempa, ale nie wyższe niż limit
        const savedWpm = savedSpeedMs ? msToWpm(savedSpeedMs) : 250;
        const initialWpm = Math.min(savedWpm, userMaxWpm); 

        setCurrentWpm(initialWpm);
        speedMsRef.current = wpmToMs(initialWpm);

        // Dopiero teraz kończymy ładowanie
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Błąd ładowania danych kalibracyjnych (tekst lub ustawienia):", err);
        if (err.response && err.response.status === 404) {
             alert("Nie można załadować tekstu kalibracyjnego. Upewnij się, że ćwiczenie o ID=" + CALIBRATION_TEXT_ID + " istnieje.");
        } else {
            alert("Nie można załadować danych kalibracyjnych. Sprawdź konsolę.");
        }
        navigate('/dashboard');
      });
  }, [token, navigate]);

  useEffect(() => {
    if (isLoading || isFinished || words.length === 0 || index >= words.length - 1) {
      clearTimeout(timerRef.current);
      return;
    }

    const step = () => {
      setIndex(prev => {
        const nextIndex = prev + 1;
        if (nextIndex >= words.length - 1) {
          clearTimeout(timerRef.current);
          return prev;
        }
        const currentWord = words[nextIndex];

        const dynamicDelay = getDynamicDelay(currentWord, speedMsRef.current);

        timerRef.current = setTimeout(step, dynamicDelay);
        return nextIndex;
      });
    };

    const initialWord = words[index];
    const initialDelay = getDynamicDelay(initialWord, speedMsRef.current);
    timerRef.current = setTimeout(step, initialDelay);

    return () => clearTimeout(timerRef.current);
  }, [words, isLoading, isFinished, index]); // Usunięto 'currentWpm' i 'speedMsRef.current' z zależności, aby uniknąć restartu timera przy każdej zmianie prędkości

  // ZMIANA: `changeSpeed` teraz używa `maxWpm` ze stanu zamiast '1500'
  const changeSpeed = useCallback((deltaWpm) => {
    setCurrentWpm(prevWpm => {
      // Używamy `maxWpm` ze stanu jako górnej granicy
      const newWpm = Math.max(50, Math.min(maxWpm, prevWpm + deltaWpm));
      speedMsRef.current = wpmToMs(newWpm);
      return newWpm;
    });
  }, [maxWpm]); // NOWOŚĆ: Dodano `maxWpm` do zależności `useCallback`

  const increaseSpeed = () => changeSpeed(WPM_STEP);
  const decreaseSpeed = () => changeSpeed(-WPM_STEP);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isFinished) return;
      if (event.key === 'ArrowUp') {
        increaseSpeed();
      } else if (event.key === 'ArrowDown') {
        decreaseSpeed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, increaseSpeed, decreaseSpeed]); // `increaseSpeed` i `decreaseSpeed` są teraz stabilne dzięki `useCallback`

  const handleFinish = () => {
    clearTimeout(timerRef.current);
    setIsFinished(true);
  };

  const handleSaveSpeed = () => {
    // Nie musimy tu dodatkowo sprawdzać `maxWpm`,
    // ponieważ `currentWpm` już jest ograniczone przez `changeSpeed`.
    const speedMsToSend = wpmToMs(currentWpm);
    axios.patch("http://127.0.0.1:8000/api/user/settings/",
      { speed: speedMsToSend },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        alert(`Zapisano ${currentWpm} WPM jako Twoje domyślne tempo!`);
        navigate('/dashboard');
      })
      .catch(() => alert("Błąd zapisu ustawień."));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center p-4 md:p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
          {/* ZMIANA: Lepszy komunikat ładowania */}
          <span className="text-xl text-text-secondary">Ładowanie danych kalibracyjnych...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main text-text-primary p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        {!isFinished ? (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Kalibracja Prędkości
              </h1>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                Czytaj tekst poniżej. Użyj przycisków lub strzałek <kbd className="inline-block px-2 py-1 bg-background-surface rounded-md border border-border-light text-text-primary">↑</kbd> <kbd className="inline-block px-2 py-1 bg-background-surface rounded-md border border-border-light text-text-primary">↓</kbd> aby dostosować tempo,
                aż poczujesz komfortową prędkość. Kliknij "Zakończ", gdy znajdziesz swoje tempo.
              </p>
            </div>

            <div className="mb-8">
              <RSVPReader currentWord={words[index]} />
            </div>

            <div className="mb-6 p-8">
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={decreaseSpeed}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-md font-semibold transition-all bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white text-2xl hover:scale-110"
                  title="Zwolnij (Strzałka w dół)"
                >
                  ➖
                </button>

                <div className="text-center min-w-[200px]">
                  <div className="text-text-muted text-sm uppercase tracking-wider mb-1">
                    Dostosuj Tempo
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-secondary rounded-full animate-pulse [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse [animation-delay:0.4s]" />
                  </div>
                  {/* NOWOŚĆ: Wyświetlamy limit WPM użytkownika */}
                  <div className="text-text-muted text-xs uppercase tracking-wider mt-2">
                    Twój limit: {maxWpm} WPM
                  </div>
                </div>

                <button
                  onClick={increaseSpeed}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-md font-semibold transition-all bg-transparent text-primary border-2 border-primary hover:bg-primary hover:text-white text-2xl hover:scale-110"
                  title="Przyspiesz (Strzałka w górę)"
                >
                  ➕
                </button>
              </div>


            </div>

            <div className="text-center">
              <button
                onClick={handleFinish}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Zakończ Kalibrację
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="max-w-2xl mx-auto text-center p-12 rounded-lg border border-border-light bg-gradient-to-r from-background-surface to-background-elevated">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-success rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>

              <h2 className="text-4xl font-bold mb-4">
                Kalibracja Zakończona!
              </h2>

              <p className="text-lg text-text-secondary mb-6">
                Twoje komfortowe tempo czytania to:
              </p>

              <div className="my-8 p-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border border-border-light">
                <div className="text-7xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {currentWpm}
                </div>
                <div className="text-2xl text-text-muted">
                  słów na minutę
                </div>
              </div>

              <p className="text-lg text-text-secondary mb-8">
                Czy chcesz zapisać tę wartość jako swoje domyślne tempo w ustawieniach?
              </p>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleSaveSpeed}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Tak, zapisz
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary text-lg"
                >
                  Nie, wróć do panelu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}