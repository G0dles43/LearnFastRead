// src/Components/dashboard/Dashboard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useExerciseFilters } from "../../hooks/useExerciseFilters";

// Importy komponentów UI
import DailyChallenge from "./DailyChallenge.jsx";
import DashboardHeader from "./DashboardHeader.jsx";
import QuickActions from "./QuickActions.jsx";
import ExerciseFilterSidebar from "./ExerciseFilterSidebar.jsx";
import ExerciseList from "./ExerciseList.jsx";
import RankedWarningModal from "../ui/RankedWarningModal.jsx";
import CollectionList from "../collections/CollectionList.jsx";
import FriendActivityFeed from "./FriendActivityFeed.jsx";

// ZMIANA 1: Komponent musi przyjmować 'api' jako "prop"
export default function Dashboard({ api }) {
  const navigate = useNavigate();
  // ZMIANA 2: Ta linia jest USUNIĘTA (ona powodowała błąd)
  // const api = useApi(); 

  // ZMIANA 3: Przekazujemy 'api' jako argument do hooków
  const { userStatus, collections, loggedInUserId, loading: dataLoading } = useDashboardData(api);
  
  const {
    exercises,
    loading: exercisesLoading,
    filterOptions,
    sortBy,
    toggleFavorite,
    deleteExercise,
    handleFilterChange,
    handleSortChange
  } = useExerciseFilters(api); // <--- Przekazujemy 'api' również tutaj

  // Stan dla Modala (logika UI zostaje w komponencie)
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const handleStartExercise = (exercise) => {
    if (exercise.is_ranked && exercise.user_attempt_status === 'rankable') {
      setSelectedExercise(exercise);
      setShowWarningModal(true);
    } else {
      navigate(`/training/${exercise.id}`);
    }
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
          isLoading={dataLoading}
          api={api} // NotificationBell wciąż potrzebuje api
        />

        <QuickActions 
          isAdmin={userStatus?.is_admin || false} 
          isLoading={dataLoading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">
          <DailyChallenge />
          <FriendActivityFeed api={api} />
        </div>
        
        <CollectionList 
          collections={collections}
          loading={dataLoading}
        />

        <div className="divider" /> 

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mt-12 items-start">
          <aside className="animate-fade-in sticky top-8" style={{ animationDelay: '0.4s' }}>
            <ExerciseFilterSidebar
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />
          </aside>

          <ExerciseList
            loading={exercisesLoading}
            exercises={exercises}
            loggedInUserId={loggedInUserId}
            onStartExercise={handleStartExercise}
            onToggleFavorite={toggleFavorite}
            onDeleteExercise={deleteExercise}
            isAdmin={userStatus?.is_admin || false} 
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