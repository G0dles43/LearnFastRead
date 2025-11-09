import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useExerciseFilters } from "../../hooks/useExerciseFilters";

import DailyChallenge from "./DailyChallenge.jsx";
import DashboardHeader from "./DashboardHeader.jsx";
import QuickActions from "./QuickActions.jsx";
import ExerciseFilterSidebar from "./ExerciseFilterSidebar.jsx";
import ExerciseList from "./ExerciseList.jsx";
import RankedWarningModal from "../ui/RankedWarningModal.jsx";
import CollectionList from "../collections/CollectionList.jsx";
import FriendActivityFeed from "./FriendActivityFeed.jsx";

export default function Dashboard({ api }) {
  const navigate = useNavigate();
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
  } = useExerciseFilters(api);

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
    <div className="min-h-screen bg-background-main text-text-primary p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1400px] px-6">

        <DashboardHeader
          userName={userStatus?.username || "..."}
          currentStreak={userStatus?.current_streak || 0}
          isLoading={dataLoading}
          api={api}
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

        <div className="h-px bg-border my-8" />

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mt-12 items-start">
          <aside className="animate-fade-in sticky top-8 [animation-delay:0.4s]">
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