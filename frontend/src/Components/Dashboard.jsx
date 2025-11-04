import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import DailyChallenge from "./DailyChallenge.jsx";

// <<< NOWE IMPORTY KOMPONENTÓW >>>
import DashboardHeader from "./DashboardHeader.jsx";
import QuickActions from "./QuickActions.jsx";
import ExerciseFilterSidebar from "./ExerciseFilterSidebar.jsx";
import ExerciseList from "./ExerciseList.jsx";
import RankedWarningModal from "./RankedWarningModal.jsx";

export default function Dashboard({ api }) {
  const [exercises, setExercises] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [userName, setUserName] = useState("");

  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [filterOptions, setFilterOptions] = useState({
    favorites: false,
    ranked: false,
    my_private: false,
  });
  const [sortBy, setSortBy] = useState('-created_at');

  // --- LOGIKA BEZ ZMIAN ---

  const handleStartExercise = (exercise) => {
    if (exercise.is_ranked) {
      if (exercise.user_attempt_status === 'rankable') {
        setSelectedExercise(exercise);
        setShowWarningModal(true);
      } else {
        navigate(`/training/${exercise.id}`);
      }
    } else {
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
      const params = { ...filterOptions, sort_by: sortBy };
      // Normalizuj parametry boolean na stringi 'true'/'false' lub usuń
      Object.keys(params).forEach(key => {
         if (key === 'favorites' || key === 'ranked' || key === 'my_private') {
            if (params[key] === true) {
                params[key] = 'true';
            } else {
                delete params[key]; // Usuń jeśli false, aby nie wysyłać ?favorites=false
            }
         }
      });

      try {
        const res = await api.get("exercises/", { params });
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
      // Odśwież listę jeśli filtrujemy po ulubionych
      if (filterOptions.favorites) {
         setExercises(prev => prev.filter(ex => ex.id !== id));
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

  // Ta funkcja obsługuje teraz nasz nowy komponent filtrów
  const handleFilterChange = (filterName) => {
    setFilterOptions(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleSortChange = (value) => {
    setSortBy(value);
  };
  
  const handleModalConfirm = () => {
    setShowWarningModal(false);
    navigate(`/training/${selectedExercise.id}`);
  };

  // --- NOWY, CZYSTY RENDER ---
  return (
    <div className="page-wrapper">
      <div className="container">
        
        <DashboardHeader userName={userName} />

        <QuickActions />

        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <DailyChallenge />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mt-12 items-start">
          
          <ExerciseFilterSidebar
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
          />

          <ExerciseList
            loading={loadingExercises}
            exercises={exercises}
            loggedInUserId={loggedInUserId}
            onStartExercise={handleStartExercise}
            onToggleFavorite={toggleFavorite}
            onDeleteExercise={deleteExercise}
          />

        </div>
      </div>

      <RankedWarningModal
        show={showWarningModal}
        exercise={selectedExercise}
        onClose={() => setShowWarningModal(false)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}