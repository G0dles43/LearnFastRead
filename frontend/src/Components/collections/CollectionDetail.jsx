import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ExerciseCard from '../dashboard/ExerciseCard.jsx';
import RankedWarningModal from '../ui/RankedWarningModal.jsx';

export default function CollectionDetail({ api }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const [collection, setCollection] = useState(null);
  const [exercises, setExercises] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setLoggedInUserId(decodedToken.user_id);
      } catch (error) {
        console.error("Błąd dekodowania tokenu:", error);
      }
    }
  }, [token]);

  useEffect(() => {
    if (!api || !slug) {
      setLoading(false);
      return;
    }

    const fetchCollection = async () => {
      setLoading(true);
      try {
        const res = await api.get(`collections/${slug}/`);
        setCollection(res.data);
        setExercises(res.data.exercises); 
        setError(null);
      } catch (err) {
        console.error("Błąd pobierania kolekcji:", err);
        setError("Nie udało się znaleźć tej kolekcji.");
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [api, slug]);


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

  const handleModalConfirm = () => {
    setShowWarningModal(false);
    navigate(`/training/${selectedExercise.id}`);
  };

  const toggleFavorite = async (id) => {
    if (!api) return;
    try {
      await api.post(`exercises/${id}/favorite/`);
      setExercises(prevExercises =>
        prevExercises.map(ex =>
          ex.id === id ? { ...ex, is_favorite: !ex.is_favorite } : ex
        )
      );
    } catch (err) {
      console.error("Błąd aktualizacji ulubionych:", err);
      alert("Błąd podczas aktualizacji ulubionych");
    }
  };

  const deleteExercise = async (id) => {
    if (!api) return;
    if (!window.confirm("Czy na pewno chcesz usunąć to ćwiczenie? (Zostanie usunięte globalnie, nie tylko z tej kolekcji)")) {
        return;
    }
    try {
      await api.delete(`exercises/${id}/delete/`);
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    } catch (err) {
      console.error("Błąd usuwania ćwiczenia:", err);
      alert("Błąd podczas usuwania ćwiczenia");
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="container max-w-2xl text-center">
          <div className="card card-elevated p-8 bg-danger/10 border-danger">
            <h2 className="text-3xl font-bold text-danger mb-4">Błąd</h2>
            <p className="text-lg text-text-secondary">{error}</p>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="btn btn-danger mt-6"
            >
              Powrót do panelu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '1200px' }}>
        <header className="mb-12 animate-fade-in">
          <div className="flex items-center gap-6">
            <span className="text-7xl">{collection.icon_name}</span>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-gradient text-5xl font-bold">
                  {collection.title}
                </h1>
                {collection.is_public && (
                  <span className="badge badge-primary" style={{ transform: 'translateY(-5px)' }}>PUBLICZNA</span>
                )}
              </div>
              <p className="text-text-secondary text-lg mt-2 max-w-3xl">
                {collection.description}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-6 text-text-secondary">
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                <strong className="text-white">{collection.exercise_count}</strong> tekstów
              </span>
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <strong className="text-white">{collection.total_words}</strong> słów łącznie
              </span>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Powrót
            </button>
          </div>
        </header>

        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {exercises.length === 0 ? (
            <div className="card card-elevated text-center py-20">
              <h3 className="text-2xl mb-2">Ta kolekcja jest pusta.</h3>
              <p className="text-text-secondary">Administrator nie dodał jeszcze żadnych ćwiczeń.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {exercises.map((ex, idx) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  loggedInUserId={loggedInUserId}
                  onStart={handleStartExercise}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteExercise}
                  animationDelay={`${0.05 * idx}s`}
                />
              ))}
            </div>
          )}
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