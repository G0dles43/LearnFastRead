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

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  // Usunięto exerciseLoading, już nie jest potrzebne

  const [filterOptions, setFilterOptions] = useState({
    favorites: false,
    ranked: false,
    my_private: false,
  });
  const [sortBy, setSortBy] = useState('-created_at');

  // --- NOWA, SYNCHRONICZNA WERSJA FUNKCJI STARTU ---
  const handleStartExercise = (exercise) => {
    // 'exercise' (czyli 'ex') ma teraz pole 'user_attempt_status' z API
    
    if (exercise.is_ranked) {
      if (exercise.user_attempt_status === 'rankable') {
        // Użytkownik MOŻE zdobyć punkty -> pokaż modal ostrzegawczy
        setSelectedExercise(exercise);
        setShowWarningModal(true);
      } else {
        // Użytkownik NIE MOŻE (jest na cooldownie 'training_cooldown' lub to 'non_ranked')
        // -> przejdź od razu do treningu
        navigate(`/training/${exercise.id}`);
      }
    } else {
      // To nie jest ćwiczenie rankingowe
      navigate(`/training/${exercise.id}`);
    }
  };

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
      setExercises(prevExercises => 
        prevExercises.map(ex => 
          ex.id === id ? { ...ex, is_favorite: !ex.is_favorite } : ex
        )
      );
      if (filterOptions.favorites) {
        setFilterOptions(prev => ({...prev}));
      }
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
    <div className="page-wrapper">
      <div className="container">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2">Fast Reader</h1>
            <p className="text-text-secondary text-lg">
              Witaj, <span className="text-primary-light font-semibold">{userName}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <button 
            className="card card-gradient flex items-center gap-4 p-6 cursor-pointer border-2 border-transparent transition-all hover:border-primary"
            onClick={() => navigate("/create-exercise")}
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg mb-1">Nowe ćwiczenie</h3>
              <p className="text-text-secondary text-sm">Stwórz własny tekst</p>
            </div>
          </button>

          <button 
            className="card card-gradient flex items-center gap-4 p-6 cursor-pointer border-2 border-transparent transition-all hover:border-warning"
            onClick={() => navigate("/ranking")}
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-warning to-[#fbbf24] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg mb-1">Ranking</h3>
              <p className="text-text-secondary text-sm">Sprawdź pozycję</p>
            </div>
          </button>

          <button 
            className="card card-gradient flex items-center gap-4 p-6 cursor-pointer border-2 border-transparent transition-all hover:border-secondary"
            onClick={() => navigate("/how-it-works")}
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-[#a78bfa] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                 <circle cx="12" cy="12" r="10"/>
                 <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                 <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg mb-1">Jak to działa?</h3>
              <p className="text-text-secondary text-sm">Zobacz zasady</p>
            </div>
          </button>
        </div>

        {/* Daily Challenge */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <DailyChallenge />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mt-12 items-start">
          {/* Sidebar - Filters */}
          <aside className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="card card-elevated sticky top-8">
              <h3 className="mb-4 text-xl flex items-center gap-2">
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
              
              <div className="flex flex-col gap-4">
                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all ${
                  filterOptions.favorites 
                    ? 'bg-[rgba(99,102,241,0.1)]' 
                    : 'hover:bg-background-main'
                }`}>
                  <input 
                    type="checkbox" 
                    name="favorites" 
                    checked={filterOptions.favorites} 
                    onChange={handleFilterChange}
                    className="w-[18px] h-[18px] cursor-pointer"
                  />
                  <span className="font-medium">Ulubione</span>
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all ${
                  filterOptions.ranked 
                    ? 'bg-[rgba(99,102,241,0.1)]' 
                    : 'hover:bg-background-main'
                }`}>
                  <input 
                    type="checkbox" 
                    name="ranked" 
                    checked={filterOptions.ranked} 
                    onChange={handleFilterChange}
                    className="w-[18px] h-[18px] cursor-pointer"
                  />
                  <span className="font-medium">Rankingowe</span>
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all ${
                  filterOptions.my_private 
                    ? 'bg-[rgba(99,102,241,0.1)]' 
                    : 'hover:bg-background-main'
                }`}>
                  <input 
                    type="checkbox" 
                    name="my_private" 
                    checked={filterOptions.my_private} 
                    onChange={handleFilterChange}
                    className="w-[18px] h-[18px] cursor-pointer"
                  />
                  <span className="font-medium">Moje prywatne</span>
                </label>
              </div>

              <div className="divider" />

              <div>
                <label className="form-label text-xs uppercase tracking-wider text-text-secondary">
                  Sortowanie
                </label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="select mt-2"
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
          <main ref={mainContentRef} className="animate-fade-in min-h-[500px]" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">
                Ćwiczenia
              </h2>
              <span className="badge badge-primary">
                {exercises.length} {exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
              </span>
            </div>

            {loadingExercises ? (
              <div className="flex items-center justify-center py-20 min-h-[400px]">
                <div className="spinner"></div>
              </div>
            ) : exercises.length > 0 ? (
              <div className="flex flex-col gap-4">
                {exercises.map((ex, idx) => (
                  <div 
                    key={ex.id} 
                    className="card animate-fade-in grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-center"
                    style={{ animationDelay: `${0.05 * idx}s` }}
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-xl font-semibold">
                          {ex.title}
                        </h3>
                        {ex.created_by_is_admin && (
                          <span className="badge badge-warning">ADMIN</span>
                        )}
                        
                        {/* --- NOWA LOGIKA ODZNAK --- */}
                        {ex.is_ranked ? (
                          <>
                            {ex.user_attempt_status === 'training_cooldown' ? (
                              <span className="badge badge-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                                </svg>
                                TRENING (Cooldown)
                              </span>
                            ) : (
                              <span className="badge badge-warning">RANKING</span>
                            )}
                          </>
                        ) : (
                          <>
                            {ex.is_public ? (
                              <span className="badge badge-primary">PUBLICZNE</span>
                            ) : (
                              <span className="badge bg-[rgba(100,116,139,0.15)] text-text-secondary border border-border">
                                PRYWATNE
                              </span>
                            )}
                          </>
                        )}
                        {/* --- KONIEC NOWEJ LOGIKI --- */}

                      </div>
                      
                      <div className="flex items-center gap-6 text-text-secondary text-sm">
                        <span className="flex items-center gap-1.5">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                          </svg>
                          {ex.word_count} słów
                        </span>
                        {ex.created_by && (
                          <span className="flex items-center gap-1.5">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            {ex.created_by}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 items-center">
                      <button 
                        className="btn btn-ghost btn-sm min-w-[40px] p-2"
                        onClick={() => toggleFavorite(ex.id)}
                        style={{ color: ex.is_favorite ? 'var(--warning)' : 'var(--text-secondary)' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={ex.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                      </button>

                      {loggedInUserId && loggedInUserId === ex.created_by_id && (
                        <button 
                          className="btn btn-ghost btn-sm min-w-[40px] p-2 text-danger"
                          onClick={() => deleteExercise(ex.id)}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      )}

                      {/* --- PRZYCISK STARTU (bez spinnera) --- */}
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleStartExercise(ex)}
                        style={{minWidth: '120px'}}
                      >
                        Rozpocznij
                      </button>
                      {/* --- KONIEC PRZYCISKU --- */}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-20 bg-background-surface min-h-[400px] flex flex-col items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mx-auto mb-6">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
                <h3 className="text-2xl mb-2">
                  Brak ćwiczeń
                </h3>
                <p className="text-text-secondary mb-6">
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

      {/* --- MODAL (bez zmian) --- */}
      {showWarningModal && selectedExercise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
          <div className="card card-elevated max-w-2xl animate-slide-in p-8">
            <h2 className="text-gradient text-3xl font-bold mb-4">
              🏆 Uwaga: Ćwiczenie Rankingowe!
            </h2>
            <p className="text-lg text-text-secondary mb-4">
              Tekst, który chcesz uruchomić (<strong className="text-white">{selectedExercise.title}</strong>), jest rankingowy.
            </p>
            <ul className="list-disc pl-6 my-6 space-y-3">
              <li>
                Twój wynik zostanie zapisany tylko jeśli osiągniesz <strong>min. 60% poprawności</strong> w quizie.
              </li>
              <li>
                Wynik można poprawić dopiero <strong>po 30 dniach</strong> od zaliczenia.
              </li>
              <li>
                Upewnij się, że masz chwilę spokoju. Powodzenia!
              </li>
            </ul>

            <p className="text-text-secondary mb-6">
              Chcesz dowiedzieć się więcej o punktacji? 
              <Link to="/how-it-works" className="text-primary font-semibold ml-1">
                Kliknij tutaj
              </Link>.
            </p>

            <div className="flex gap-4 justify-end">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowWarningModal(false)}
              >
                Anuluj
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setShowWarningModal(false);
                  navigate(`/training/${selectedExercise.id}`);
                }}
              >
                Rozumiem, rozpocznij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ); 
}