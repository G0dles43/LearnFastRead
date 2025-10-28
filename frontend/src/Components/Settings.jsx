import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Settings.module.css";

const msToWpm = (ms) => {
  if (!ms || ms <= 0) return 100; 
  return Math.round(60000 / ms); 
};

const wpmToMs = (wpm) => {
  if (!wpm || wpm <= 0) return 600; 
  return Math.round(60000 / wpm);
};

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [wpm, setWpm] = useState(300); 
  
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("rsvp");
  const [highlightWidth, setHighlightWidth] = useState(600);
  const [highlightHeight, setHighlightHeight] = useState(300);
  const [chunkSize, setChunkSize] = useState(3);

  useEffect(() => {
    if (!token) {
        setLoading(false); 
        return;
    }
    axios
      .get("http://127.0.0.1:8000/api/user/settings/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const speedMs = res.data.speed;
        setWpm(msToWpm(speedMs)); 
        
        setIsMuted(res.data.muted);
        setMode(res.data.mode);
        setHighlightWidth(res.data.highlight_width || 600);
        setHighlightHeight(res.data.highlight_height || 300);
        setChunkSize(res.data.chunk_size || 3);
        setLoading(false);
      })
      .catch(() => {
        console.error("Błąd pobierania ustawień, używam domyślnych.");
        setLoading(false); 
      });
  }, [token]);

  const handleSave = () => {
    if (!token) return alert("Nie jesteś zalogowany!");

    const speedMsToSend = wpmToMs(wpm);

    axios
      .patch(
        "http://127.0.0.1:8000/api/user/settings/",
        {
          speed: speedMsToSend, 
          muted: isMuted,
          mode,
          highlight_width: highlightWidth,
          highlight_height: highlightHeight,
          chunk_size: chunkSize,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        alert("Ustawienia zapisane!");
        navigate("/dashboard");
      })
      .catch(() => {
        alert("Błąd zapisu ustawień");
      });
  };

  if (loading) return <p className={styles.loading}>Ładowanie ustawień...</p>;

  const getChunkHint = () => {
    switch(chunkSize) {
      case 2: return "2 słowa - szybkie tempo";
      case 3: return "3 słowa - balans (zalecane)";
      case 4: return "4 słowa - wolniejsze, bardziej komfortowe";
      case 5: return "5 słów - bardzo wolne";
      default: return "";
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <h2 className={styles.settingsTitle}>Ustawienia</h2>

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

      <div className={styles.settingGroup}>
        <div className={styles.rangeWrapper}>
          <label className={styles.rangeLabel}>
            Tempo (Słowa na minutę): <strong>{wpm} WPM</strong>
          </label>
          <input
            className={styles.rangeInput}
            type="range"
            min="20" 
            max="1000" 
            step="10"  
            value={wpm}
            onChange={(e) => setWpm(parseInt(e.target.value))}
          />
        </div>
      </div>

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
            Wycisz kliknięcie
          </label>
        </div>
      </div>

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

      {mode === "highlight" && (
        <div className={styles.modeSettings}>
            {/* ... (kod bez zmian) ... */}
            <h4 className={styles.modeSettingsTitle}>Ustawienia Highlight</h4>
            <div style={{ marginTop: "15px" }}>
                <label className={styles.label}>
                Szerokość okna (px):
                <input
                    className={styles.inputNumber}
                    type="number"
                    min="200"
                    max="1200"
                    value={highlightWidth}
                    onChange={(e) => setHighlightWidth(parseInt(e.target.value))}
                />
                </label>
            </div>
            <div style={{ marginTop: "15px" }}>
                <label className={styles.label}>
                Wysokość okna (px):
                <input
                    className={styles.inputNumber}
                    type="number"
                    min="100"
                    max="800"
                    value={highlightHeight}
                    onChange={(e) => setHighlightHeight(parseInt(e.target.value))}
                />
                </label>
            </div>
        </div>
      )}

      <button className={styles.saveButton} onClick={handleSave}>
        Zapisz i wróć
      </button>
    </div>
  );
}