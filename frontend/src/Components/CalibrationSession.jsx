import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RSVPReader from "./RSVPReader.jsx";
import { getDynamicDelay } from "../utils/readingUtils.js"; 

const msToWpm = (ms) => Math.round(60000 / ms);
const wpmToMs = (wpm) => Math.round(60000 / wpm);

const CALIBRATION_TEXT_ID = 18;
const WPM_STEP = 5;

export default function CalibrationSession() {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [currentWpm, setCurrentWpm] = useState(250);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const timerRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const speedMsRef = useRef(wpmToMs(currentWpm));

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    axios.get(`http://127.0.0.1:8000/api/exercises/${CALIBRATION_TEXT_ID}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => {
     const cleanText = res.data.text
        .replace(/<[^>]+>|\([^)]*\)|[\[\]{};:,<>/\\|_\-+=]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      setWords(cleanText.split(/\s+/));
      setIsLoading(false);
    })
    .catch(err => {
      console.error("Błąd ładowania tekstu kalibracyjnego:", err);
      alert("Nie można załadować tekstu kalibracyjnego. Upewnij się, że ćwiczenie o ID=" + CALIBRATION_TEXT_ID + " istnieje.");
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

        timerRef.current = setTimeout(step, dynamicDelay);        return nextIndex;
      });
    };

    const initialWord = words[index];
    const initialDelay = getDynamicDelay(initialWord, speedMsRef.current);
    timerRef.current = setTimeout(step, initialDelay);

    return () => clearTimeout(timerRef.current);
  }, [words, isLoading, isFinished, index]);

  const changeSpeed = useCallback((deltaWpm) => {
    setCurrentWpm(prevWpm => {
      const newWpm = Math.max(50, Math.min(1500, prevWpm + deltaWpm));
      speedMsRef.current = wpmToMs(newWpm); 
      return newWpm;
    });
  }, []);

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
  }, [isFinished, increaseSpeed, decreaseSpeed]);

  const handleFinish = () => {
    clearTimeout(timerRef.current);
    setIsFinished(true);
  };

  const handleSaveSpeed = () => {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="spinner" />
          <span className="text-xl text-white/70">Ładowanie tekstu kalibracyjnego...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container max-w-5xl">
        {!isFinished ? (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-gradient text-5xl font-bold mb-4">
                Kalibracja Prędkości
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                Czytaj tekst poniżej. Użyj przycisków lub strzałek <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">↑</kbd> <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">↓</kbd> aby dostosować tempo,
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
                  className="btn btn-outline w-14 h-14 text-2xl hover:scale-110"
                  title="Zwolnij (Strzałka w dół)"
                >
                  ➖
                </button>
                
                <div className="text-center min-w-[200px]">
                  <div className="text-white/60 text-sm uppercase tracking-wider mb-1">
                    Dostosuj Tempo
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
                
                <button 
                  onClick={increaseSpeed}
                  className="btn btn-outline w-14 h-14 text-2xl hover:scale-110"
                  title="Przyspiesz (Strzałka w górę)"
                >
                  ➕
                </button>
              </div>

              
            </div>

            <div className="text-center">
              <button 
                onClick={handleFinish}
                className="btn btn-primary btn-lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Zakończ Kalibrację
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="card card-gradient max-w-2xl mx-auto text-center p-12">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>

              <h2 className="text-4xl font-bold mb-4">
                Kalibracja Zakończona!
              </h2>
              
              <p className="text-lg text-white/70 mb-6">
                Twoje komfortowe tempo czytania to:
              </p>

              <div className="my-8 p-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-white/10">
                <div className="text-7xl font-bold text-gradient mb-2">
                  {currentWpm}
                </div>
                <div className="text-2xl text-white/60">
                  słów na minutę
                </div>
              </div>

              <p className="text-lg text-white/80 mb-8">
                Czy chcesz zapisać tę wartość jako swoje domyślne tempo w ustawieniach?
              </p>

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={handleSaveSpeed}
                  className="btn btn-primary btn-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Tak, zapisz
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary btn-lg"
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