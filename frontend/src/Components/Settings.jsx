import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [speed, setSpeed] = useState(200);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("rsvp");
  const [highlightWidth, setHighlightWidth] = useState(600);
  const [highlightHeight, setHighlightHeight] = useState(300);

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://127.0.0.1:8000/api/user/settings/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSpeed(res.data.speed);
        setIsMuted(res.data.muted);
        setMode(res.data.mode);
        setHighlightWidth(res.data.highlight_width || 600);
        setHighlightHeight(res.data.highlight_height || 300);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSave = () => {
    if (!token) return alert("Nie jesteś zalogowany!");
    axios
      .patch(
        "http://127.0.0.1:8000/api/user/settings/",
        {
          speed,
          muted: isMuted,
          mode,
          highlight_width: highlightWidth,
          highlight_height: highlightHeight,
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

  if (loading) return <p>Ładowanie ustawień...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>Ustawienia</h2>

      <div style={{ marginTop: "20px" }}>
        <label>
          Tryb czytania: <br />
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="rsvp">RSVP (jedno słowo)</option>
            <option value="highlight">Podświetlanie w tekście</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Tempo (ms na słowo): {speed}ms
          <br />
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
          />
        </label>
      </div>

      <div style={{ marginTop: "20px" }}>
        <label>
          <input
            type="checkbox"
            checked={isMuted}
            onChange={(e) => setIsMuted(e.target.checked)}
          />
          Wycisz kliknięcie
        </label>
      </div>

      {mode === "highlight" && (
        <>
          <div style={{ marginTop: "20px" }}>
            <label>
              Szerokość okna (px): <br />
              <input
                type="number"
                min="200"
                max="1200"
                value={highlightWidth}
                onChange={(e) => setHighlightWidth(parseInt(e.target.value))}
              />
            </label>
          </div>

          <div style={{ marginTop: "20px" }}>
            <label>
              Wysokość okna (px): <br />
              <input
                type="number"
                min="100"
                max="800"
                value={highlightHeight}
                onChange={(e) => setHighlightHeight(parseInt(e.target.value))}
              />
            </label>
          </div>
        </>
      )}

      <button onClick={handleSave} style={{ marginTop: "30px" }}>
        Zapisz i wróć
      </button>
    </div>
  );
}
