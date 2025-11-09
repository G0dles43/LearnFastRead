import React from "react";
import { useNavigate } from "react-router-dom";
import ExerciseCard from "./ExerciseCard.jsx";

export default function ExerciseList({
  loading,
  exercises,
  loggedInUserId,
  onStartExercise,
  onToggleFavorite,
  onDeleteExercise,
  isAdmin
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <main className="animate-fade-in min-h-[500px] [animation-delay:0.4s]">
        <div className="flex items-center justify-center py-20 min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (exercises.length === 0) {
    return (
      <main className="animate-fade-in min-h-[500px] [animation-delay:0.4s]">
        <div className="bg-background-elevated shadow-md rounded-lg border border-border text-center py-20 min-h-[400px] flex flex-col items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="mx-auto mb-6 stroke-text-muted">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <h3 className="text-2xl mb-2">Brak ćwiczeń</h3>
          <p className="text-text-secondary mb-6">Zmień filtry lub stwórz nowe ćwiczenie</p>
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light"
            onClick={() => navigate("/create-exercise")}
          >
            Stwórz ćwiczenie
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="animate-fade-in min-h-[500px] [animation-delay:0.4s]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Ćwiczenia</h2>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-primary/15 text-primary-light border border-primary/30">
          {exercises.length} {exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {exercises.map((ex, idx) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            loggedInUserId={loggedInUserId}
            onStart={onStartExercise}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDeleteExercise}
            animationDelay={`${0.05 * idx}s`}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </main>
  );
}