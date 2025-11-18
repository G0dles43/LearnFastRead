import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const msToWpm = (ms) => {
  if (!ms || ms <= 0) return 300;
  return Math.round(60000 / ms);
};

const wpmToMs = (wpm) => {
  if (!wpm || wpm <= 0) return 200;
  return Math.round(60000 / wpm);
};

const HIGHLIGHT_WIDTH_MIN = 200;
const HIGHLIGHT_WIDTH_MAX = 1200;
const HIGHLIGHT_HEIGHT_MIN = 100;
const HIGHLIGHT_HEIGHT_MAX = 800;

export default function Settings({ api }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [wpm, setWpm] = useState(300);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("rsvp");
  const [highlightWidth, setHighlightWidth] = useState(600);
  const [highlightHeight, setHighlightHeight] = useState(300);
  const [chunkSize, setChunkSize] = useState(3);

  const [maxWpmLimit, setMaxWpmLimit] = useState(350);

  useEffect(() => {
    if (!token || !api) {
      console.log("Settings: Brak tokenu lub instancji api.");
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("user/settings/")
      .then((res) => {
        const limit = res.data.max_wpm_limit || 350;
        setMaxWpmLimit(limit);

        const speedMs = res.data.speed;
        
        let calculatedWpm = msToWpm(speedMs);

        if (calculatedWpm > limit) {
            calculatedWpm = limit;
        }

        setWpm(calculatedWpm);
        
        setIsMuted(res.data.muted);
        setMode(res.data.mode || 'rsvp');
        setHighlightWidth(Math.max(HIGHLIGHT_WIDTH_MIN, Math.min(HIGHLIGHT_WIDTH_MAX, res.data.highlight_width || 600)));
        setHighlightHeight(Math.max(HIGHLIGHT_HEIGHT_MIN, Math.min(HIGHLIGHT_HEIGHT_MAX, res.data.highlight_height || 300)));
        setChunkSize(res.data.chunk_size || 3);
      })
      .catch((err) => {
        console.error("Błąd pobierania ustawień:", err);
        setWpm(300);
        setIsMuted(false);
        setMode('rsvp');
        setHighlightWidth(600);
        setHighlightHeight(300);
        setChunkSize(3);
        setMaxWpmLimit(350);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, api]);

  const handleSave = () => {
    if (!token || !api) return alert("Nie jesteś zalogowany lub wystąpił błąd!");

    let wpmToSave = wpm;
    if (wpm > maxWpmLimit) {
      console.warn(`Próba ustawienia ${wpm} WPM przy limicie ${maxWpmLimit}. Resetuję do limitu.`);
      setWpm(maxWpmLimit);
      wpmToSave = maxWpmLimit;
    }

    const speedMsToSend = wpmToMs(wpmToSave);
    const finalWidth = Math.max(HIGHLIGHT_WIDTH_MIN, Math.min(HIGHLIGHT_WIDTH_MAX, highlightWidth));
    const finalHeight = Math.max(HIGHLIGHT_HEIGHT_MIN, Math.min(HIGHLIGHT_HEIGHT_MAX, highlightHeight));

    api
      .patch("user/settings/", {
        speed: speedMsToSend,
        muted: isMuted,
        mode,
        highlight_width: finalWidth,
        highlight_height: finalHeight,
        chunk_size: chunkSize,
      })
      .then(() => {
        alert("Ustawienia zapisane!");
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error("Błąd zapisu ustawień:", err.response);
        if (err.response?.data?.speed) {
          alert(`Błąd: ${err.response.data.speed[0]}`);
          setWpm(maxWpmLimit);
        } else {
          alert("Nieznany błąd zapisu ustawień.");
        }
      });
  };

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

  const getChunkHint = () => {
    if (chunkSize === 2) return "Bardzo wolne - dla początkujących";
    if (chunkSize === 3) return "Standardowe - zalecane dla większości";
    if (chunkSize === 4) return "Szybkie - dla zaawansowanych";
    if (chunkSize === 5) return "Bardzo szybkie - dla ekspertów";
    return "";
  };

  if (loading) return (
    <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen text-text-primary p-4 md:p-8 bg-gradient-to-br from-background-main/95 to-background-surface/95 bg-[url('/3.png')] bg-cover bg-center bg-fixed">
      <div className="mx-auto w-full max-w-[900px]">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Ustawienia
            </h1>
            <p className="text-text-secondary text-lg">
              Dostosuj aplikację do swoich potrzeb
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
            onClick={() => navigate("/dashboard")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Powrót
          </button>
        </header>

        <div className="bg-background-elevated shadow-md rounded-lg border border-border p-6 animate-fade-in [animation-delay:0.1s]">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              Tryb czytania
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setMode('rsvp')}
                className={`p-6 cursor-pointer transition-all text-center rounded-lg border-2 ${mode === 'rsvp' ? 'border-primary bg-primary/10' : 'border-border bg-background-main'
                  }`}
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-md flex items-center justify-center ${mode === 'rsvp' ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-background-elevated'
                  }`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" className={mode === 'rsvp' ? 'stroke-white' : 'stroke-current'}>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6v6H9z" />
                  </svg>
                </div>
                <div className="font-semibold mb-1">RSVP</div>
                <div className="text-sm text-text-secondary">Jedno słowo</div>
              </button>

              <button
                onClick={() => setMode('highlight')}
                className={`p-6 cursor-pointer transition-all text-center rounded-lg border-2 ${mode === 'highlight' ? 'border-primary bg-primary/10' : 'border-border bg-background-main'
                  }`}
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-md flex items-center justify-center ${mode === 'highlight' ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-background-elevated'
                  }`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" className={mode === 'highlight' ? 'stroke-white' : 'stroke-current'}>
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div className="font-semibold mb-1">Highlight</div>
                <div className="text-sm text-text-secondary">Podświetlanie</div>
              </button>

              <button
                onClick={() => setMode('chunking')}
                className={`p-6 cursor-pointer transition-all text-center rounded-lg border-2 ${mode === 'chunking' ? 'border-primary bg-primary/10' : 'border-border bg-background-main'
                  }`}
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-md flex items-center justify-center ${mode === 'chunking' ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-background-elevated'
                  }`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" className={mode === 'chunking' ? 'stroke-white' : 'stroke-current'}>
                    <rect x="3" y="4" width="18" height="4" rx="1" />
                    <rect x="3" y="10" width="18" height="4" rx="1" />
                    <rect x="3" y="16" width="18" height="4" rx="1" />
                  </svg>
                </div>
                <div className="font-semibold mb-1">Chunking</div>
                <div className="text-sm text-text-secondary">Grupy słów</div>
              </button>
            </div>
          </div>

          <div className="h-px bg-border my-8" />

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Prędkość czytania
            </h2>

            <div className="bg-background-main rounded-lg border border-border p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Tempo (WPM)</span>
                <div className="px-4 py-2 bg-gradient-to-r from-primary to-primary-light rounded-md font-bold text-xl text-white min-w-[100px] text-center">
                  {wpm}
                </div>
              </div>

              <input
                type="range"
                min="100"
                max={maxWpmLimit}
                step="10"
                value={Math.min(wpm, maxWpmLimit)}  
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  setWpm(Math.min(newValue, maxWpmLimit));  {/* POPRAWKA: Nie pozwól przekroczyć */}
                }}
                className="w-full h-3 rounded-lg outline-none appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((Math.min(wpm, maxWpmLimit) - 100) / (maxWpmLimit - 100)) * 100}%, var(--border) ${((Math.min(wpm, maxWpmLimit) - 100) / (maxWpmLimit - 100)) * 100}%, var(--border) 100%)`
                }}
              />

              <div className="flex justify-between text-text-secondary text-sm mt-3">
                <span>100 WPM</span>
                <span className="text-text-muted">Opóźnienie: {wpmToMs(wpm)}ms / słowo</span>
                <span>{maxWpmLimit} WPM (Twój limit)</span>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/30 p-4 mt-6 text-center text-sm rounded-lg">
              <strong className="text-primary-light font-semibold block mb-2">
                Twój obecny limit prędkości to {maxWpmLimit} WPM.
              </strong>
              <p className="text-text-secondary m-0">
                Aby odblokować wyższy limit, ukończ ćwiczenie rankingowe
                z prędkością {maxWpmLimit} WPM (lub wyższą) i trafnością {'>'}60%.
              </p>
            </div>

          </div>

          {mode === "chunking" && (
            <>
              <div className="h-px bg-border my-8" />
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="4" rx="1" />
                    <rect x="3" y="10" width="18" height="4" rx="1" />
                    <rect x="3" y="16" width="18" height="4" rx="1" />
                  </svg>
                  Ustawienia Chunking
                </h2>

                <div className="bg-background-main rounded-lg border border-border p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold">Rozmiar chunka</span>
                    <div className="px-4 py-2 bg-gradient-to-r from-secondary to-purple-400 rounded-md font-bold text-xl text-white min-w-[80px] text-center">
                      {chunkSize}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="2"
                    max="5"
                    step="1"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    className="w-full h-3 rounded-lg outline-none appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${((chunkSize - 2) / 3) * 100}%, var(--border) ${((chunkSize - 2) / 3) * 100}%, var(--border) 100%)`
                    }}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-text-secondary text-sm">2 słowa</span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary-light border border-primary/30 text-sm">{getChunkHint()}</span>
                    <span className="text-text-secondary text-sm">5 słów</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {mode === "highlight" && (
            <>
              <div className="h-px bg-border my-8" />
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  Ustawienia Highlight
                </h2>

                <div className="grid gap-6">
                  <div className="bg-background-main rounded-lg border border-border p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Szerokość okna</span>
                      <div className="px-4 py-2 bg-gradient-to-r from-primary to-primary-light rounded-md font-bold text-white">
                        {highlightWidth}px
                      </div>
                    </div>

                    <input
                      type="range"
                      min={HIGHLIGHT_WIDTH_MIN}
                      max={HIGHLIGHT_WIDTH_MAX}
                      step="50"
                      value={highlightWidth}
                      onChange={(e) => setHighlightWidth(parseInt(e.target.value))}
                      className="w-full h-3 rounded-lg outline-none appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((highlightWidth - HIGHLIGHT_WIDTH_MIN) / (HIGHLIGHT_WIDTH_MAX - HIGHLIGHT_WIDTH_MIN)) * 100}%, var(--border) ${((highlightWidth - HIGHLIGHT_WIDTH_MIN) / (HIGHLIGHT_WIDTH_MAX - HIGHLIGHT_WIDTH_MIN)) * 100}%, var(--border) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-text-secondary text-sm mt-3">
                      <span>{HIGHLIGHT_WIDTH_MIN}px</span>
                      <span>{HIGHLIGHT_WIDTH_MAX}px</span>
                    </div>
                  </div>

                  <div className="bg-background-main rounded-lg border border-border p-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Wysokość okna</span>
                      <div className="px-4 py-2 bg-gradient-to-r from-secondary to-purple-400 rounded-md font-bold text-white">
                        {highlightHeight}px
                      </div>
                    </div>

                    <input
                      type="range"
                      min={HIGHLIGHT_HEIGHT_MIN}
                      max={HIGHLIGHT_HEIGHT_MAX}
                      step="50"
                      value={highlightHeight}
                      onChange={(e) => setHighlightHeight(parseInt(e.target.value))}
                      className="w-full h-3 rounded-lg outline-none appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${((highlightHeight - HIGHLIGHT_HEIGHT_MIN) / (HIGHLIGHT_HEIGHT_MAX - HIGHLIGHT_HEIGHT_MIN)) * 100}%, var(--border) ${((highlightHeight - HIGHLIGHT_HEIGHT_MIN) / (HIGHLIGHT_HEIGHT_MAX - HIGHLIGHT_HEIGHT_MIN)) * 100}%, var(--border) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-text-secondary text-sm mt-3">
                      <span>{HIGHLIGHT_HEIGHT_MIN}px</span>
                      <span>{HIGHLIGHT_HEIGHT_MAX}px</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-border my-8" />

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                {isMuted && <line x1="23" y1="9" x2="17" y2="15"/>}
                {isMuted && <line x1="17" y1="9" x2="23" y2="15"/>}
                {!isMuted && <path d="M15.54 8.46a5 5 0 010 7.07"/>}
              </svg>
              Dźwięk
            </h2>
            
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              cursor: 'pointer',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              background: isMuted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: isMuted ? '2px solid var(--danger)' : '2px solid var(--success)',
              transition: 'var(--transition)'
            }}>
              <input 
                type="checkbox" 
                checked={isMuted} 
                onChange={(e) => setIsMuted(e.target.checked)}
                style={{ width: '24px', height: '24px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  {isMuted ? 'Dźwięk wyciszony' : 'Dźwięk włączony'}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {isMuted ? 'Bez kliknięć podczas czytania' : 'Kliknięcie przy każdym słowie'}
                </div>
              </div>
            </label>
          </div>

          <button
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
            Zapisz ustawienia
          </button>
        </div>
      </div>
    </div>
  );
}