import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RSVPReader from "./RSVPReader.jsx"; // Użyjemy RSVP
import styles from "./CalibrationSession.module.css"; // Style

// Funkcje pomocnicze z Settings
const msToWpm = (ms) => Math.round(60000 / ms);
const wpmToMs = (wpm) => Math.round(60000 / wpm);

// ID tekstu kalibracyjnego z panelu admina
const CALIBRATION_TEXT_ID = 18; // <-- ZMIEŃ NA ID TWOJEGO TEKSTU!
const WPM_STEP = 5; // O ile WPM zmieniać przy kliknięciu/naciśnięciu

export default function CalibrationSession() {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [currentWpm, setCurrentWpm] = useState(250); // Startowe WPM
  // Usunięto currentSpeedMs ze stanu
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  // --- DODANO REF DLA PRĘDKOŚCI w Milisekundach ---
  const speedMsRef = useRef(wpmToMs(currentWpm));
  // --- KONIEC REF ---

  // --- Pobieranie tekstu ---
  useEffect(() => {
    if (!token) {
        navigate('/login');
        return;
    }
    axios.get(`http://127.0.0.1:8000/api/exercises/${CALIBRATION_TEXT_ID}/`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => {
        const cleanText = res.data.text.replace(/\s+/g, " ").trim();
        setWords(cleanText.split(/\s+/));
        setIsLoading(false);
    })
    .catch(err => {
        console.error("Błąd ładowania tekstu kalibracyjnego:", err);
        alert("Nie można załadować tekstu kalibracyjnego. Upewnij się, że ćwiczenie o ID=" + CALIBRATION_TEXT_ID + " istnieje.");
        navigate('/dashboard');
    });
  }, [token, navigate]);

  // --- ZMODYFIKOWANY Główny Timer ---
  useEffect(() => {
    // Warunki zatrzymania
    if (isLoading || isFinished || words.length === 0 || index >= words.length - 1) {
      clearTimeout(timerRef.current);
      return;
    }

    // Funkcja wykonująca następny krok
    const step = () => {
      setIndex(prev => {
        const nextIndex = prev + 1;
        // Ponownie sprawdź warunek końca wewnątrz aktualizacji stanu
        if (nextIndex >= words.length - 1) {
           clearTimeout(timerRef.current);
           return prev; // Pozostań na ostatnim słowie
        }

        // Zaplanuj *następny* krok, używając *aktualnej* prędkości z ref
        timerRef.current = setTimeout(step, speedMsRef.current);
        return nextIndex;
      });
    };

    // Uruchom pętlę timera
    timerRef.current = setTimeout(step, speedMsRef.current);

    // Funkcja czyszcząca
    return () => clearTimeout(timerRef.current);

  // WAŻNE: Usunięto zależność od prędkości (speedMs).
  }, [words, isLoading, isFinished, index]); // Zależy teraz tylko od indeksu i listy słów
  // --- KONIEC ZMODYFIKOWANEGO TIMERA ---

  // --- Funkcje do zmiany prędkości (zmodyfikowane, aby aktualizować ref) ---
  const changeSpeed = useCallback((deltaWpm) => {
    setCurrentWpm(prevWpm => {
        const newWpm = Math.max(50, Math.min(1500, prevWpm + deltaWpm)); // Ogranicz WPM (50-1500)
        // --- ZAKTUALIZUJ REF ---
        speedMsRef.current = wpmToMs(newWpm); // Zaktualizuj ref natychmiast
        // --- KONIEC AKTUALIZACJI REF ---
        return newWpm; // Zwróć nowe WPM do aktualizacji stanu
    });
  }, []); // Pusta tablica zależności

  const increaseSpeed = () => changeSpeed(WPM_STEP);
  const decreaseSpeed = () => changeSpeed(-WPM_STEP);

  // --- Obsługa klawiatury (Strzałki góra/dół) ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isFinished) return; // Nie reaguj po zakończeniu
      if (event.key === 'ArrowUp') {
        increaseSpeed();
      } else if (event.key === 'ArrowDown') {
        decreaseSpeed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, increaseSpeed, decreaseSpeed]); // Używamy callbacków z useCallback

  // --- Zakończenie kalibracji ---
  const handleFinish = () => {
    clearTimeout(timerRef.current); // Zatrzymaj czytanie
    setIsFinished(true); // Pokaż wyniki
  };

  // --- Zapisanie wyniku jako domyślny ---
  const handleSaveSpeed = () => {
    const speedMsToSend = wpmToMs(currentWpm); // Przelicz finalne WPM na MS
    axios.patch("http://127.0.0.1:8000/api/user/settings/",
      { speed: speedMsToSend }, // Wysyłamy tylko pole 'speed'
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(() => {
        alert(`Zapisano ${currentWpm} WPM jako Twoje domyślne tempo!`);
        navigate('/dashboard');
    })
    .catch(() => alert("Błąd zapisu ustawień."));
  };

  // --- Renderowanie ---
  if (isLoading) {
    return <p className={styles.message}>Ładowanie tekstu kalibracyjnego...</p>;
  }

  return (
    <div className={styles.calibrationContainer}>
      {!isFinished ? (
        // --- Ekran Kalibracji ---
        <>
          <h2 className={styles.title}>Kalibracja Prędkości</h2>
          <p className={styles.instructions}>
            Czytaj tekst poniżej. Użyj przycisków lub strzałek (↑/↓), aby dostosować tempo,
            aż poczujesz komfortową prędkość. Nie widzisz teraz WPM.
            Kliknij "Zakończ", gdy znajdziesz swoje tempo.
          </p>

          {/* Czytnik RSVP */}
          <RSVPReader currentWord={words[index]} />

          {/* Kontrolki Prędkości */}
          <div className={styles.controls}>
            <button onClick={decreaseSpeed} title="Zwolnij (Strzałka w dół)">➖</button>
            <span className={styles.speedIndicator}>Dostosuj Tempo</span>            {/* --- KONIEC AKTUALIZACJI --- */}
            <button onClick={increaseSpeed} title="Przyspiesz (Strzałka w górę)">➕</button>
          </div>

          {/* Przycisk Zakończ */}
          <button onClick={handleFinish} className={styles.finishButton}>
            Zakończ Kalibrację
          </button>
        </>
      ) : (
        // --- Ekran Wyników ---
        <div className={styles.results}>
          <h2 className={styles.title}>Kalibracja Zakończona!</h2>
          <p className={styles.resultText}>
            Twoje komfortowe tempo czytania to:
          </p>
          <p className={styles.finalWpm}>{currentWpm} WPM</p>
          <p className={styles.actionPrompt}>
            Czy chcesz zapisać tę wartość jako swoje domyślne tempo w ustawieniach?
          </p>
          <div className={styles.resultActions}>
            <button onClick={handleSaveSpeed} className="button-primary">Tak, zapisz</button>
            <button onClick={() => navigate('/dashboard')} className="button-secondary">Nie, wróć do panelu</button>
          </div>
        </div>
      )}
    </div>
  );
}