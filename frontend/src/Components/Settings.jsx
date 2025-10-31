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
        const speedMs = res.data.speed;
        setWpm(msToWpm(speedMs));
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, api]);

  const handleSave = () => {
    if (!token || !api) return alert("Nie jesteś zalogowany lub wystąpił błąd!");

    const speedMsToSend = wpmToMs(wpm);
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
        console.error("Błąd zapisu ustawień:", err);
        alert("Błąd zapisu ustawień.");
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="page-wrapper" style={{ 
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%), url("/3.png")', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed' 
    }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2">Ustawienia</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Dostosuj aplikację do swoich potrzeb
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Powrót
          </button>
        </header>

        {/* Main Settings Card */}
        <div className="card card-elevated animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Reading Mode */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              </svg>
              Tryb czytania
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <button
                onClick={() => setMode('rsvp')}
                className="card"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  border: mode === 'rsvp' ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: mode === 'rsvp' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-main)',
                  transition: 'var(--transition)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: mode === 'rsvp' ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={mode === 'rsvp' ? 'white' : 'currentColor'} strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 9h6v6H9z"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>RSVP</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Jedno słowo</div>
              </button>

              <button
                onClick={() => setMode('highlight')}
                className="card"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  border: mode === 'highlight' ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: mode === 'highlight' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-main)',
                  transition: 'var(--transition)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: mode === 'highlight' ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={mode === 'highlight' ? 'white' : 'currentColor'} strokeWidth="2">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Highlight</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Podświetlanie</div>
              </button>

              <button
                onClick={() => setMode('chunking')}
                className="card"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  border: mode === 'chunking' ? '2px solid var(--primary)' : '2px solid var(--border)',
                  background: mode === 'chunking' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-main)',
                  transition: 'var(--transition)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: mode === 'chunking' ? 'linear-gradient(135deg, var(--primary), var(--primary-light))' : 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={mode === 'chunking' ? 'white' : 'currentColor'} strokeWidth="2">
                    <rect x="3" y="4" width="18" height="4" rx="1"/>
                    <rect x="3" y="10" width="18" height="4" rx="1"/>
                    <rect x="3" y="16" width="18" height="4" rx="1"/>
                  </svg>
                </div>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Chunking</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Grupy słów</div>
              </button>
            </div>
          </div>

          <div className="divider" />

          {/* Speed Settings */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Prędkość czytania
            </h2>
            
            <div className="card" style={{ background: 'var(--bg-main)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600 }}>Tempo (WPM)</span>
                <div style={{ 
                  padding: '0.5rem 1rem', 
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: 'white',
                  minWidth: '100px',
                  textAlign: 'center'
                }}>
                  {wpm}
                </div>
              </div>

              <input
                type="range"
                min="100"
                max="1500"
                step="10"
                value={wpm}
                onChange={(e) => setWpm(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '12px',
                  borderRadius: '6px',
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((wpm - 100) / 1400) * 100}%, var(--border) ${((wpm - 100) / 1400) * 100}%, var(--border) 100%)`,
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                <span>100 WPM</span>
                <span style={{ color: 'var(--text-muted)' }}>Opóźnienie: {wpmToMs(wpm)}ms / słowo</span>
                <span>1500 WPM</span>
              </div>
            </div>
          </div>

          {/* Chunking Settings */}
          {mode === "chunking" && (
            <>
              <div className="divider" />
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="4" rx="1"/>
                    <rect x="3" y="10" width="18" height="4" rx="1"/>
                    <rect x="3" y="16" width="18" height="4" rx="1"/>
                  </svg>
                  Ustawienia Chunking
                </h2>
                
                <div className="card" style={{ background: 'var(--bg-main)', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 600 }}>Rozmiar chunka</span>
                    <div style={{ 
                      padding: '0.5rem 1rem', 
                      background: 'linear-gradient(135deg, var(--secondary), #a78bfa)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      color: 'white',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
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
                    style={{
                      width: '100%',
                      height: '12px',
                      borderRadius: '6px',
                      background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${((chunkSize - 2) / 3) * 100}%, var(--border) ${((chunkSize - 2) / 3) * 100}%, var(--border) 100%)`,
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>2 słowa</span>
                    <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>{getChunkHint()}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>5 słów</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Highlight Settings */}
          {mode === "highlight" && (
            <>
              <div className="divider" />
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                  </svg>
                  Ustawienia Highlight
                </h2>
                
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div className="card" style={{ background: 'var(--bg-main)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 600 }}>Szerokość okna</span>
                      <div style={{ 
                        padding: '0.5rem 1rem', 
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        color: 'white'
                      }}>
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
                      style={{
                        width: '100%',
                        height: '12px',
                        borderRadius: '6px',
                        background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((highlightWidth - HIGHLIGHT_WIDTH_MIN) / (HIGHLIGHT_WIDTH_MAX - HIGHLIGHT_WIDTH_MIN)) * 100}%, var(--border) ${((highlightWidth - HIGHLIGHT_WIDTH_MIN) / (HIGHLIGHT_WIDTH_MAX - HIGHLIGHT_WIDTH_MIN)) * 100}%, var(--border) 100%)`,
                        outline: 'none',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                      <span>{HIGHLIGHT_WIDTH_MIN}px</span>
                      <span>{HIGHLIGHT_WIDTH_MAX}px</span>
                    </div>
                  </div>

                  <div className="card" style={{ background: 'var(--bg-main)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 600 }}>Wysokość okna</span>
                      <div style={{ 
                        padding: '0.5rem 1rem', 
                        background: 'linear-gradient(135deg, var(--secondary), #a78bfa)',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        color: 'white'
                      }}>
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
                      style={{
                        width: '100%',
                        height: '12px',
                        borderRadius: '6px',
                        background: `linear-gradient(to right, var(--secondary) 0%, var(--secondary) ${((highlightHeight - HIGHLIGHT_HEIGHT_MIN) / (HIGHLIGHT_HEIGHT_MAX - HIGHLIGHT_HEIGHT_MIN)) * 100}%, var(--border) ${((highlightHeight - HIGHLIGHT_HEIGHT_MIN) / (HIGHLIGHT_HEIGHT_MAX - HIGHLIGHT_HEIGHT_MIN)) * 100}%, var(--border) 100%)`,
                        outline: 'none',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                      <span>{HIGHLIGHT_HEIGHT_MIN}px</span>
                      <span>{HIGHLIGHT_HEIGHT_MAX}px</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="divider" />

          {/* Audio Settings */}
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

          {/* Save Button */}
          <button onClick={handleSave} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <path d="M17 21v-8H7v8M7 3v5h8"/>
            </svg>
            Zapisz ustawienia
          </button>
        </div>
      </div>
    </div>
  );
}