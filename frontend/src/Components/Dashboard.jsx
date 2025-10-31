import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import DailyChallenge from "./DailyChallenge.jsx";
import { jwtDecode } from "jwt-decode";

export default function Dashboard({ api }) {
  const [exercises, setExercises] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [userName, setUserName] = useState("");
  const mainContentRef = useRef(null);

  const [filterOptions, setFilterOptions] = useState({
    favorites: false,
    ranked: false,
    my_private: false,
  });
  const [sortBy, setSortBy] = useState('-created_at');

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setLoggedInUserId(decodedToken.user_id);
        setUserName(decodedToken.username || "Użytkowniku");
      } catch (error) {
        console.error("Błąd dekodowania tokenu:", error);
        localStorage.clear();
      }
    }
  }, [token]);

  useEffect(() => {
    if (!api) {
      console.error("Instancja API nie została przekazana do Dashboard!");
      setLoadingExercises(false);
      return;
    }

    async function fetchExercises() {
      setLoadingExercises(true);
      const params = {};
      if (filterOptions.favorites) params.favorites = 'true';
      if (filterOptions.ranked) params.ranked = 'true';
      if (filterOptions.my_private) params.my_private = 'true';
      if (sortBy) params.sort_by = sortBy;

      try {
        const res = await api.get("exercises/", { params: params });
        setExercises(res.data);
      } catch (err) {
        console.error("Błąd pobierania ćwiczeń:", err);
        if (err.response?.status !== 401) {
          alert("Wystąpił błąd podczas pobierania ćwiczeń.");
        }
      } finally {
        setLoadingExercises(false);
      }
    }

    if (token && loggedInUserId !== null && api) {
      fetchExercises();
    } else if (!api || !token) {
      setLoadingExercises(false);
    }
  }, [token, loggedInUserId, filterOptions, sortBy, api]);

  const toggleFavorite = async (id) => {
    if (!api) return;
    try {
      await api.post(`exercises/${id}/favorite/`, {});
      setFilterOptions(prev => ({...prev}));
    } catch (err) {
      console.error("Błąd aktualizacji ulubionych:", err);
      alert("Błąd podczas aktualizacji ulubionych");
    }
  };

  const deleteExercise = async (id) => {
    if (!api) return;
    if (!window.confirm("Czy na pewno chcesz usunąć to ćwiczenie?")) return;
    try {
      await api.delete(`exercises/${id}/delete/`);
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      console.error("Błąd usuwania ćwiczenia:", err);
      alert("Błąd podczas usuwania ćwiczenia");
    }
  };

  const handleFilterChange = (e) => {
    const { name, checked } = e.target;
    setFilterOptions(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  return (
    <div className="page-wrapper" style={{ 
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.95) 0%, rgba(26, 26, 46, 0.95) 100%), url("/3.png")', 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      backgroundAttachment: 'fixed' 
    }}>
      <div className="container">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2">Fast Reader</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Witaj, <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{userName}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/calibrate" className="btn btn-ghost">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
              </svg>
              Kalibracja
            </Link>
            <Link to="/settings" className="btn btn-ghost">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
              </svg>
              Ustawienia
            </Link>
            <button 
              className="btn btn-secondary"
              onClick={() => {localStorage.clear(); navigate("/"); }}
            >
              Wyloguj
            </button>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <button 
            className="card card-gradient flex items-center gap-4 p-6"
            onClick={() => navigate("/create-exercise")}
            style={{ cursor: 'pointer', border: '2px solid transparent', transition: 'var(--transition)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Nowe ćwiczenie</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Stwórz własny tekst</p>
            </div>
          </button>

          <button 
            className="card card-gradient flex items-center gap-4 p-6"
            onClick={() => navigate("/ranking")}
            style={{ cursor: 'pointer', border: '2px solid transparent', transition: 'var(--transition)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--warning)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--warning), #fbbf24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Ranking</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sprawdź pozycję</p>
            </div>
          </button>

          <button 
            className="card card-gradient flex items-center gap-4 p-6"
            onClick={() => navigate("/calibrate")}
            style={{ cursor: 'pointer', border: '2px solid transparent', transition: 'var(--transition)' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--secondary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--secondary), #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Kalibracja</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Dostosuj tempo</p>
            </div>
          </button>
        </div>

        {/* Daily Challenge */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <DailyChallenge />
        </div>

        {/* Main Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', marginTop: '3rem', alignItems: 'start' }}>
          {/* Sidebar - Filters */}
          <aside className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="card card-elevated" style={{ position: 'sticky', top: '2rem' }}>
              <h3 className="mb-4" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="21" x2="4" y2="14"/>
                  <line x1="4" y1="10" x2="4" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12" y2="3"/>
                  <line x1="20" y1="21" x2="20" y2="16"/>
                  <line x1="20" y1="12" x2="20" y2="3"/>
                </svg>
                Filtry
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition)',
                  background: filterOptions.favorites ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = filterOptions.favorites ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-main)'}
                onMouseLeave={(e) => e.currentTarget.style.background = filterOptions.favorites ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                >
                  <input 
                    type="checkbox" 
                    name="favorites" 
                    checked={filterOptions.favorites} 
                    onChange={handleFilterChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500 }}>Ulubione</span>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition)',
                  background: filterOptions.ranked ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = filterOptions.ranked ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-main)'}
                onMouseLeave={(e) => e.currentTarget.style.background = filterOptions.ranked ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                >
                  <input 
                    type="checkbox" 
                    name="ranked" 
                    checked={filterOptions.ranked} 
                    onChange={handleFilterChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500 }}>Rankingowe</span>
                </label>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition)',
                  background: filterOptions.my_private ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = filterOptions.my_private ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-main)'}
                onMouseLeave={(e) => e.currentTarget.style.background = filterOptions.my_private ? 'rgba(99, 102, 241, 0.1)' : 'transparent'}
                >
                  <input 
                    type="checkbox" 
                    name="my_private" 
                    checked={filterOptions.my_private} 
                    onChange={handleFilterChange}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 500 }}>Moje prywatne</span>
                </label>
              </div>

              <div className="divider" />

              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  Sortowanie
                </label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="select"
                  style={{ marginTop: '0.5rem' }}
                >
                  <option value="-created_at">Najnowsze</option>
                  <option value="created_at_asc">Najstarsze</option>
                  <option value="title_asc">Tytuł (A-Z)</option>
                  <option value="title_desc">Tytuł (Z-A)</option>
                  <option value="word_count_desc">Najdłuższe</option>
                  <option value="word_count_asc">Najkrótsze</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Exercises Grid */}
          <main ref={mainContentRef} className="animate-fade-in" style={{ animationDelay: '0.4s', minHeight: '500px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                Ćwiczenia
              </h2>
              <span className="badge badge-primary">
                {exercises.length} {exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
              </span>
            </div>

            {loadingExercises ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', minHeight: '400px' }}>
                <div className="spinner"></div>
              </div>
            ) : exercises.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {exercises.map((ex, idx) => (
                  <div 
                    key={ex.id} 
                    className="card animate-fade-in"
                    style={{ 
                      animationDelay: `${0.05 * idx}s`,
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '1.5rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {ex.title}
                        </h3>
                        {ex.created_by_is_admin && (
                          <span className="badge badge-warning">ADMIN</span>
                        )}
                        {ex.is_ranked && (
                          <span className="badge badge-warning">RANKING</span>
                        )}
                        {ex.is_public ? (
                          <span className="badge badge-primary">PUBLICZNE</span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            PRYWATNE
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                          </svg>
                          {ex.word_count} słów
                        </span>
                        {ex.created_by && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            {ex.created_by}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => toggleFavorite(ex.id)}
                        style={{ 
                          minWidth: '40px',
                          padding: '0.5rem',
                          color: ex.is_favorite ? 'var(--warning)' : 'var(--text-secondary)'
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={ex.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                      </button>

                      {loggedInUserId && loggedInUserId === ex.created_by_id && (
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => deleteExercise(ex.id)}
                          style={{ 
                            minWidth: '40px',
                            padding: '0.5rem',
                            color: 'var(--danger)'
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      )}

                      <button 
                        className="btn btn-primary"
                        onClick={() => navigate(`/training/${ex.id}`)}
                      >
                        Rozpocznij
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                className="card"
                style={{ 
                  textAlign: 'center',
                  padding: '5rem 2rem',
                  background: 'var(--bg-surface)',
                  minHeight: '400px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 1.5rem' }}>
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  Brak ćwiczeń
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Zmień filtry lub stwórz nowe ćwiczenie
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate("/create-exercise")}
                >
                  Stwórz ćwiczenie
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}