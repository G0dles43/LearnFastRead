import React, { useEffect, useState } from "react";
// Usunięto: import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Dashboard.module.css";
import DailyChallenge from "./DailyChallenge.jsx";
import { jwtDecode } from "jwt-decode";

// Odbieramy 'api' z propsów
export default function Dashboard({ api }) {
  const [exercises, setExercises] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("access"); // Potrzebny do sprawdzenia logowania
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loadingExercises, setLoadingExercises] = useState(true);

  const [filterOptions, setFilterOptions] = useState({
      favorites: false,
      ranked: false,
      my_private: false,
  });
  const [sortBy, setSortBy] = useState('-created_at');

  // Pobieranie ID użytkownika
  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setLoggedInUserId(decodedToken.user_id);
      } catch (error) {
        console.error("Błąd dekodowania tokenu:", error);
        localStorage.clear();
        // Nie używaj navigate tutaj, interceptor w App powinien to obsłużyć
      }
    } else {
       // Nie ma tokenu, użytkownik nie jest zalogowany
       // Interceptor w App powinien przekierować do logowania, jeśli spróbuje wejść
    }
  }, [token]); // Usunięto navigate z zależności

  // Pobieranie ćwiczeń - używa 'api'
  useEffect(() => {
    // Sprawdź, czy 'api' zostało przekazane
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

      console.log("Wysyłane parametry:", params);

      try {
        // Używamy api.get, bez ręcznego nagłówka
        const res = await api.get("exercises/", { params: params });
        setExercises(res.data);
      } catch (err) {
        // Błąd 401 powinien zostać obsłużony przez interceptor w App.jsx
        // Można dodać obsługę innych błędów, jeśli potrzebne
        console.error("Błąd pobierania ćwiczeń (może być obsłużony przez interceptor):", err);
        // Opcjonalnie: Pokaż użytkownikowi komunikat o błędzie, jeśli to nie 401
        if (err.response?.status !== 401) {
            alert("Wystąpił błąd podczas pobierania ćwiczeń.");
        }
      } finally {
         setLoadingExercises(false);
      }
    }

    // Pobieraj tylko jeśli jest token, ID usera i instancja api
    if (token && loggedInUserId !== null && api) {
        fetchExercises();
    } else if (!api || !token) { // Jeśli brakuje api lub tokenu, zakończ ładowanie
        setLoadingExercises(false);
    }
  // Zależności: token, user ID, filtry, sortowanie ORAZ instancja api
  }, [token, loggedInUserId, filterOptions, sortBy, api]);

  // toggleFavorite - używa 'api'
  const toggleFavorite = async (id) => {
    if (!api) return;
    try {
      await api.post(`exercises/${id}/favorite/`, {});
      // Odświeżenie listy przez zmianę stanu filtrów
      setFilterOptions(prev => ({...prev}));
    } catch (err) {
      console.error("Błąd aktualizacji ulubionych:", err);
      alert("Błąd podczas aktualizacji ulubionych");
    }
  };

  // deleteExercise - używa 'api'
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

  // Obsługa zmiany filtrów
  const handleFilterChange = (e) => {
      const { name, checked } = e.target;
      setFilterOptions(prev => ({
          ...prev,
          [name]: checked
      }));
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h2>Twój Panel</h2>
        <div className={styles.headerActions}>
          <button className="button-secondary" onClick={() => navigate("/ranking")}>Ranking</button>
          <Link to="/calibrate" className="button-secondary">⚙️ Kalibracja Prędkości</Link>
          <button className="button-secondary" onClick={() => navigate("/create-exercise")}>➕ Stwórz ćwiczenie</button>
          <button className="button-secondary" onClick={() => navigate("/settings")}>⚙️ Ustawienia</button>
          <button className="button-danger" onClick={() => {localStorage.clear(); navigate("/"); }}>Wyloguj</button>
        </div>
      </header>

      <DailyChallenge /> {/* Zakładam, że ten komponent też potrzebuje 'api', dodaj prop jeśli tak */}

      {/* Pasek filtrów i sortowania */}
      <div className={styles.filterSortBar}>
          <div className={styles.filterGroup}>
              <span className={styles.groupLabel}>Filtruj:</span>
              <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="favorites" checked={filterOptions.favorites} onChange={handleFilterChange}/>
                  <span>⭐ Ulubione</span>
              </label>
              <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="ranked" checked={filterOptions.ranked} onChange={handleFilterChange}/>
                  <span>🏆 Rankingowe</span>
              </label>
               <label className={styles.checkboxLabel}>
                  <input type="checkbox" name="my_private" checked={filterOptions.my_private} onChange={handleFilterChange}/>
                  <span>🔒 Moje Prywatne</span>
              </label>
          </div>
          <div className={styles.sortGroup}>
               <label htmlFor="sortBySelect" className={styles.groupLabel}>Sortuj według:</label>
               <select id="sortBySelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.sortSelect}>
                  <option value="-created_at">Najnowsze</option>
                  <option value="created_at_asc">Najstarsze</option>
                  <option value="title_asc">Tytuł (A-Z)</option>
                  <option value="title_desc">Tytuł (Z-A)</option>
                  <option value="word_count_desc">Długość (Najdłuższe)</option>
                  <option value="word_count_asc">Długość (Najkrótsze)</option>
              </select>
          </div>
      </div>

      {/* Lista Ćwiczeń */}
      <div className={styles.exerciseList}>
        {loadingExercises ? (
            <p>Ładowanie ćwiczeń...</p>
        ) : exercises.length > 0 ? (
          exercises.map((ex) => (
            <div key={ex.id} className={styles.exerciseCard}>
              <div className={styles.exerciseInfo}>
                  <strong>{ex.title}</strong>
                  {ex.created_by_is_admin && <span className={styles.adminTag}>👑 Admin</span>}
                  <span className={styles.details}>
                      ({ex.word_count} słów)
                      {ex.created_by && (ex.created_by_is_admin || !ex.created_by_is_admin) && (
                          <> • Utworzone przez: {ex.created_by} </>
                      )}
                  </span>
                  <div className={styles.exerciseTags}>
                      {ex.is_public ? (<span className={styles.tag}>🌐 Publiczne</span>) : (<span className={styles.tag}>🔒 Prywatne</span>)}
                      {ex.is_ranked && (<span className={`${styles.tag} ${styles.ranked}`}>🏆 Rankingowe</span>)}
                  </div>
              </div>
              <div className={styles.exerciseActions}>
                  <button className="button-primary" onClick={() => navigate(`/training/${ex.id}`)}>Start</button>
                  <button className={`button-icon ${ex.is_favorite ? styles.favoriteActive : ''}`} onClick={() => toggleFavorite(ex.id)} title={ex.is_favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}>
                      {ex.is_favorite ? "⭐" : "☆"}
                  </button>
                  {loggedInUserId && loggedInUserId === ex.created_by_id && (
                      <button className="button-icon button-danger" onClick={() => deleteExercise(ex.id)} title="Usuń ćwiczenie">🗑️</button>
                  )}
              </div>
            </div>
          ))
        ) : (
          <p>Nie znaleziono ćwiczeń pasujących do wybranych filtrów.</p>
        )}
      </div>
    </div>
  );
}