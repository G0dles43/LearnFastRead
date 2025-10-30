import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Settings.module.css";


const msToWpm = (ms) => {
  if (!ms || ms <= 0) return 300; // Domyślne WPM, jeśli ms jest nieprawidłowe
  return Math.round(60000 / ms);
};

const wpmToMs = (wpm) => {
  if (!wpm || wpm <= 0) return 200; // Domyślne MS, jeśli WPM jest nieprawidłowe
  return Math.round(60000 / wpm);
};

const HIGHLIGHT_WIDTH_MIN = 200;
const HIGHLIGHT_WIDTH_MAX = 1200;
const HIGHLIGHT_HEIGHT_MIN = 100;
const HIGHLIGHT_HEIGHT_MAX = 800;

export default function Settings({ api }) { // Odbierz 'api' z propsów
  const navigate = useNavigate();
  const token = localStorage.getItem("access"); // Nadal potrzebny do sprawdzenia logowania

  // Stany komponentu
  const [wpm, setWpm] = useState(300); // Stan dla WPM
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("rsvp");
  const [highlightWidth, setHighlightWidth] = useState(600);
  const [highlightHeight, setHighlightHeight] = useState(300);
  const [chunkSize, setChunkSize] = useState(3);

  // Pobieranie ustawień z backendu
  useEffect(() => {
    // Sprawdź czy jest token i instancja api
    if (!token || !api) {
        console.log("Settings: Brak tokenu lub instancji api.");
        setLoading(false);
        // Opcjonalnie: Przekieruj do logowania, jeśli nie ma tokenu
        // if (!token) navigate('/login');
        return;
    }
    setLoading(true); // Ustaw ładowanie na true przed zapytaniem
    api // Użyj przekazanej instancji 'api'
      .get("user/settings/") // Nie potrzebujesz już nagłówka Authorization
      .then((res) => {
        const speedMs = res.data.speed;
        setWpm(msToWpm(speedMs)); // Przelicz MS na WPM
        setIsMuted(res.data.muted);
        setMode(res.data.mode || 'rsvp'); // Ustaw domyślny tryb, jeśli brak
        // Użyj stałych do walidacji wartości z backendu (na wszelki wypadek)
        setHighlightWidth(Math.max(HIGHLIGHT_WIDTH_MIN, Math.min(HIGHLIGHT_WIDTH_MAX, res.data.highlight_width || 600)));
        setHighlightHeight(Math.max(HIGHLIGHT_HEIGHT_MIN, Math.min(HIGHLIGHT_HEIGHT_MAX, res.data.highlight_height || 300)));
        setChunkSize(res.data.chunk_size || 3);
      })
      .catch((err) => {
        console.error("Błąd pobierania ustawień, używam domyślnych.", err);
        // Ustaw domyślne wartości w razie błędu
        setWpm(300);
        setIsMuted(false);
        setMode('rsvp');
        setHighlightWidth(600);
        setHighlightHeight(300);
        setChunkSize(3);
      })
      .finally(() => {
          setLoading(false); // Zakończ ładowanie niezależnie od wyniku
      });
  // Zależności: token i instancja api
  }, [token, api]);

  // Zapisywanie ustawień do backendu
  const handleSave = () => {
    if (!token || !api) return alert("Nie jesteś zalogowany lub wystąpił błąd!");

    const speedMsToSend = wpmToMs(wpm); // Przelicz WPM na MS

    // Przytnij wartości wymiarów do zakresu przed wysłaniem
    const finalWidth = Math.max(HIGHLIGHT_WIDTH_MIN, Math.min(HIGHLIGHT_WIDTH_MAX, highlightWidth));
    const finalHeight = Math.max(HIGHLIGHT_HEIGHT_MIN, Math.min(HIGHLIGHT_HEIGHT_MAX, highlightHeight));

    api // Użyj przekazanej instancji 'api'
      .patch(
        "user/settings/", // Nie potrzebujesz nagłówka Authorization
        {
          speed: speedMsToSend,
          muted: isMuted,
          mode,
          highlight_width: finalWidth,
          highlight_height: finalHeight,
          chunk_size: chunkSize,
        }
      )
      .then(() => {
        alert("Ustawienia zapisane!");
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error("Błąd zapisu ustawień:", err);
        alert("Błąd zapisu ustawień.");
      });
  };

  // Obsługa zmiany inputów liczbowych Highlight (z walidacją)
  const handleWidthChange = (e) => {
    const value = parseInt(e.target.value, 10);
    const clampedValue = Math.max(HIGHLIGHT_WIDTH_MIN, Math.min(HIGHLIGHT_WIDTH_MAX, isNaN(value) ? HIGHLIGHT_WIDTH_MIN : value));
    setHighlightWidth(clampedValue);
  };

  const handleHeightChange = (e) => {
    const value = parseInt(e.target.value, 10);
    const clampedValue = Math.max(HIGHLIGHT_HEIGHT_MIN, Math.min(HIGHLIGHT_HEIGHT_MAX, isNaN(value) ? HIGHLIGHT_HEIGHT_MIN : value));
    setHighlightHeight(clampedValue);
  };

  // Tekst podpowiedzi dla Chunking (bez zmian)
  const getChunkHint = () => { /* ... */ };


  if (loading) return <p className={styles.loading}>Ładowanie ustawień...</p>;

  // --- RENDEROWANIE KOMPONENTU ---
  return (
    <div className={styles.settingsContainer}>
      <h2 className={styles.settingsTitle}>Ustawienia</h2>

      {/* --- Grupa: Tryb czytania --- */}
      <div className={styles.settingGroup}>
        <label className={styles.label}>
          Tryb czytania:
          <select
            className={styles.select}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="rsvp">RSVP (jedno słowo)</option>
            <option value="highlight">Podświetlanie w tekście</option>
            <option value="chunking">Chunking (grupy słów)</option>
          </select>
        </label>
      </div>

      {/* --- Grupa: Tempo (WPM) --- */}
      <div className={styles.settingGroup}>
        <div className={styles.rangeWrapper}>
          <label className={styles.rangeLabel}>
            Tempo (Słowa na minutę): <strong>{wpm} WPM</strong>
          </label>
          <input
            className={styles.rangeInput}
            type="range"
            min="100" // Minimalne WPM
            max="1500" // Maksymalne WPM
            step="10"
            value={wpm}
            onChange={(e) => setWpm(parseInt(e.target.value))}
          />
           {/* Dodatkowa podpowiedź o przeliczeniu na MS (opcjonalnie) */}
           <div className={styles.hint}>
                Opóźnienie: {wpmToMs(wpm)}ms / słowo
           </div>
        </div>
      </div>

      {/* --- Grupa: Wycisz --- */}
      <div className={styles.settingGroup}>
        <div className={styles.checkboxWrapper}>
          <input
            id="muteCheckbox"
            className={styles.checkbox}
            type="checkbox"
            checked={isMuted}
            onChange={(e) => setIsMuted(e.target.checked)}
          />
          <label htmlFor="muteCheckbox" className={styles.checkboxLabel}>
            Wycisz dźwięk kliknięcia
          </label>
        </div>
      </div>

      {/* --- Ustawienia dla trybu Chunking --- */}
      {mode === "chunking" && (
        <div className={styles.modeSettings}>
            <h4 className={styles.modeSettingsTitle}>Ustawienia Chunking</h4>
            <div className={styles.rangeWrapper}>
                <label className={styles.rangeLabel}>
                Rozmiar chunka (ile słów naraz): <strong>{chunkSize}</strong>
                </label>
                <input
                className={styles.rangeInput}
                type="range"
                min="2"
                max="5"
                step="1"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                />
                <div className={styles.hint}>{getChunkHint()}</div>
            </div>
        </div>
      )}

      {/* --- Ustawienia dla trybu Highlight (z walidacją i hintami) --- */}
      {mode === "highlight" && (
        <div className={styles.modeSettings}>
            <h4 className={styles.modeSettingsTitle}>Ustawienia Highlight</h4>
            <div style={{ marginTop: "15px" }}>
                <label className={styles.label}>
                  Szerokość okna (px):
                  <input
                      className={styles.inputNumber}
                      type="number"
                      min={HIGHLIGHT_WIDTH_MIN}
                      max={HIGHLIGHT_WIDTH_MAX}
                      value={highlightWidth}
                      onChange={handleWidthChange} // Użyj handlera z walidacją
                  />
                  <div className={styles.hint}>
                      (Zakres: {HIGHLIGHT_WIDTH_MIN} - {HIGHLIGHT_WIDTH_MAX}px)
                  </div>
                </label>
            </div>
            <div style={{ marginTop: "15px" }}>
                <label className={styles.label}>
                  Wysokość okna (px):
                  <input
                      className={styles.inputNumber}
                      type="number"
                      min={HIGHLIGHT_HEIGHT_MIN}
                      max={HIGHLIGHT_HEIGHT_MAX}
                      value={highlightHeight}
                      onChange={handleHeightChange} // Użyj handlera z walidacją
                  />
                  <div className={styles.hint}>
                      (Zakres: {HIGHLIGHT_HEIGHT_MIN} - {HIGHLIGHT_HEIGHT_MAX}px)
                  </div>
                </label>
            </div>
        </div>
      )}

      {/* --- Przycisk Zapisz --- */}
      <button className={styles.saveButton} onClick={handleSave}>
        Zapisz i wróć
      </button>
    </div>
  );
}