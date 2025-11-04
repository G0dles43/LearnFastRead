import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import DailyChallenge from "./DailyChallenge.jsx";
import DashboardHeader from "./DashboardHeader.jsx";
import QuickActions from "./QuickActions.jsx";
import ExerciseFilterSidebar from "./ExerciseFilterSidebar.jsx";
import ExerciseList from "./ExerciseList.jsx";
import RankedWarningModal from "./RankedWarningModal.jsx";
import CollectionList from "./CollectionList.jsx";

export default function Dashboard({ api }) {
  const [exercises, setExercises] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loadingExercises, setLoadingExercises] = useState(true);

  const [userStatus, setUserStatus] = useState(null); 
  const [statusLoading, setStatusLoading] = useState(true);

  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [filterOptions, setFilterOptions] = useState({
    favorites: false,
    ranked: false,
    my_private: false,
  });
  const [sortBy, setSortBy] = useState('-created_at');

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
      } catch (error) {
        console.error("Błąd dekodowania tokenu:", error);
        localStorage.clear();
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token || !api) {
      setStatusLoading(false);
      return;
    }
    
    setStatusLoading(true);
    api.get("user/status/")
      .then(res => {
        setUserStatus(res.data);
      })
      .catch(err => {
        console.error("Nie udało się pobrać statusu użytkownika", err);
      })
      .finally(() => {
        setStatusLoading(false);
      });
  }, [token, api]);

  useEffect(() => {
    if (!token || !api) {
      setLoadingCollections(false);
      return;
    }
    
    setLoadingCollections(true);
    api.get("collections/")
      .then(res => {
        setCollections(res.data); 
      })
      .catch(err => {
        console.error("Nie udało się pobrać kolekcji:", err);
      })
      .finally(() => {
        setLoadingCollections(false);
      });
  }, [token, api]);

  useEffect(() => {
    if (!api) {
      console.error("Instancja API nie została przekazana do Dashboard!");
      setLoadingExercises(false);
      return;
    }

    async function fetchExercises() {
      setLoadingExercises(true);
      const params = { ...filterOptions, sort_by: sortBy };
      Object.keys(params).forEach(key => {
        if (key === 'favorites' || key === 'ranked' || key === 'my_private') {
          if (params[key] === true) {
            params[key] = 'true';
          } else {
            delete params[key]; 
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

  return (
    <div className="page-wrapper">
      <div className="container">
        
        <DashboardHeader 
            userName={userStatus?.username || "..."} 
            currentStreak={userStatus?.current_streak || 0}
            isLoading={statusLoading}
        />

        <QuickActions 
          isAdmin={userStatus?.is_admin || false} 
          isLoading={statusLoading}
        />

        {/* Sekcje pełnej szerokości */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <DailyChallenge />
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CollectionList 
            collections={collections}
            loading={loadingCollections}
          />
        </div>

        <div className="divider" /> 

        {/* Główna siatka (Sidebar + Lista ćwiczeń) */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mt-12 items-start">
          
          {/* Kolumna 1: Sidebar (z animacją i sticky) */}
          <aside className="animate-fade-in sticky top-8" style={{ animationDelay: '0.4s' }}>
            <ExerciseFilterSidebar
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />
          </aside>

          {/* Kolumna 2: Lista ćwiczeń (ma własną animację wewnątrz) */}
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