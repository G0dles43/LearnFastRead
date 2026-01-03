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
      <main className="animate-fade-in min-h-[500px]">
        <div className="flex items-center justify-center py-20 min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (exercises.length === 0) {
    return (
      <main className="animate-fade-in min-h-[500px]">
        <div className="bg-background-elevated border-2 border-dashed border-border rounded-xl text-center py-20 px-4 min-h-[400px] flex flex-col items-center justify-center">
          <div className="p-4 rounded-full bg-background-main mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="stroke-text-muted">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Brak ćwiczeń</h3>
          <p className="text-text-secondary mb-6 max-w-md">Nie znaleziono ćwiczeń pasujących do Twoich filtrów. Spróbuj zmienić ustawienia lub stwórz własne.</p>
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all text-white shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light"
            onClick={() => navigate("/create-exercise")}
          >
            Stwórz ćwiczenie
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="animate-fade-in min-h-[500px] [animation-delay:0.2s]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Ćwiczenia</h2>
          <p className="text-text-secondary text-sm mt-1">Wybierz tekst i trenuj swoje umiejętności</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-background-elevated border border-border text-text-secondary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          {exercises.length} {exercises.length === 1 ? 'ćwiczenie' : 'ćwiczeń'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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