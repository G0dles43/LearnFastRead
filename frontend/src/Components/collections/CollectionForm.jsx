import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

export default function CollectionForm({ api }) {
  const { slug } = useParams(); 
  const isEditMode = Boolean(slug);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('📚');
  const [isPublic, setIsPublic] = useState(false);

  const [allExercises, setAllExercises] = useState([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!api) {
        setError("Błąd API");
        setLoading(false);
        return;
      }

      try {
        const statusRes = await api.get("user/status/");
        if (!statusRes.data.is_admin) {
          setError("Brak uprawnień. Ta sekcja jest dostępna tylko dla administratorów.");
          setLoading(false);
          navigate("/dashboard");
          return;
        }
        setIsAdmin(true);

        const exercisesRes = await api.get("exercises/", {
            params: { sort_by: 'title_asc' } 
        });
        setAllExercises(exercisesRes.data);

        if (isEditMode) {
          const collectionRes = await api.get(`collections/${slug}/`);
          const collection = collectionRes.data;
          
          setTitle(collection.title);
          setDescription(collection.description);
          setIconName(collection.icon_name);
          setIsPublic(collection.is_public);
          
          const initialIds = collection.exercises.map(ex => ex.id);
          setSelectedExerciseIds(new Set(initialIds));
        }
        
      } catch (err) {
        console.error("Błąd ładowania danych formularza:", err);
        setError("Nie udało się pobrać danych. Spróbuj odświeżyć stronę.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api, navigate, slug, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const payload = {
      title,
      description,
      icon_name: iconName,
      is_public: isPublic,
      exercise_ids: Array.from(selectedExerciseIds)
    };

    try {
      if (isEditMode) {
        await api.patch(`collections/${slug}/`, payload);
      } else {
        await api.post("collections/", payload);
      }
      navigate("/manage-collections");

    } catch (err) {
      console.error("Błąd zapisu kolekcji:", err);
      const errorData = err.response?.data;
      if (errorData) {
        const errorMsg = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(' ') : value}`)
          .join('\n');
        setError(errorMsg || "Wystąpił nieznany błąd walidacji.");
      } else {
        setError("Wystąpił błąd sieciowy. Spróbuj ponownie.");
      }
      setIsSubmitting(false);
    }
  };

  const addExerciseToCollection = (id) => {
    setSelectedExerciseIds(prevIds => new Set(prevIds).add(id));
  };

  const removeExerciseFromCollection = (id) => {
    setSelectedExerciseIds(prevIds => {
      const newIds = new Set(prevIds);
      newIds.delete(id);
      return newIds;
    });
  };

  const availableExercises = useMemo(() => {
    return allExercises
      .filter(ex => !selectedExerciseIds.has(ex.id)) 
      .filter(ex => 
        ex.title.toLowerCase().includes(searchTerm.toLowerCase()) 
      );
  }, [allExercises, selectedExerciseIds, searchTerm]);

  const selectedExercises = useMemo(() => {
    return allExercises.filter(ex => selectedExerciseIds.has(ex.id));
  }, [allExercises, selectedExerciseIds]);



  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && !isSubmitting) { 
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="container max-w-2xl text-center">
          <div className="card card-elevated p-8 bg-danger/10 border-danger">
            <h2 className="text-3xl font-bold text-danger mb-4">Błąd</h2>
            <p className="text-lg text-text-secondary whitespace-pre-line">{error}</p>
            <button 
              onClick={() => navigate("/manage-collections")} 
              className="btn btn-danger mt-6"
            >
              Powrót do listy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '1200px' }}>
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2">
              {isEditMode ? 'Edytuj Kolekcję' : 'Stwórz Kolekcję'}
            </h1>
            <p className="text-text-secondary text-lg">
              {isEditMode ? `Edytujesz "${title}"` : 'Wypełnij dane nowej kolekcji'}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate("/manage-collections")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Anuluj
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && isSubmitting && (
             <div className="card p-4 bg-danger/10 border-danger text-danger font-medium whitespace-pre-line">
                {error}
             </div>
          )}

          <div className="card card-elevated p-6">
            <h3 className="text-xl font-semibold mb-6">Podstawowe Informacje</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label">Tytuł</label>
                <input
                  type="text"
                  className="input"
                  placeholder="np. Historia Polski"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ikona (Emoji)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="📚"
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  maxLength={5}
                />
              </div>
            </div>
            <div className="form-group mt-6">
              <label className="form-label">Opis</label>
              <textarea
                className="textarea"
                placeholder="Krótki opis kolekcji..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group mt-6">
              <label className="flex items-center gap-3 p-4 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] cursor-pointer hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <div>
                  <span className="font-semibold">Kolekcja Publiczna</span>
                  <p className="text-sm text-text-secondary">Zaznacz, jeśli kolekcja ma być widoczna dla wszystkich użytkowników.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="card card-elevated p-6">
            <h3 className="text-xl font-semibold mb-6">Ćwiczenia w Kolekcji</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="form-label">Dostępne ćwiczenia</label>
                <input
                  type="text"
                  className="input mb-3"
                  placeholder="Filtruj ćwiczenia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="h-80 overflow-y-auto border border-[var(--border)] rounded-lg bg-[var(--bg-main)] p-2 space-y-2">
                  {availableExercises.length > 0 ? (
                    availableExercises.map(ex => (
                      <div key={ex.id} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-surface-hover)]">
                        <span className="text-sm">{ex.title}</span>
                        <button
                          type="button"
                          title="Dodaj do kolekcji"
                          onClick={() => addExerciseToCollection(ex.id)}
                          className="btn btn-ghost btn-sm text-success p-1"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-secondary text-sm text-center p-4">Brak dostępnych ćwiczeń lub wszystkie zostały dodane.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">
                  W tej kolekcji ({selectedExercises.length})
                </label>
                <div className="h-[23.5rem] overflow-y-auto border border-primary/50 rounded-lg bg-[var(--bg-surface)] p-2 space-y-2">
                  {selectedExercises.length > 0 ? (
                    selectedExercises.map(ex => (
                      <div key={ex.id} className="flex items-center justify-between p-2 rounded hover:bg-[var(--bg-surface-hover)]">
                        <span className="text-sm font-semibold">{ex.title}</span>
                        <button
                          type="button"
                          title="Usuń z kolekcji"
                          onClick={() => removeExerciseFromCollection(ex.id)}
                          className="btn btn-ghost btn-sm text-danger p-1"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-secondary text-sm text-center p-4">Wybierz ćwiczenia z listy po lewej, aby je dodać.</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="spinner-small"></div>
                  Zapisywanie...
                </div>
              ) : (
                isEditMode ? 'Zapisz Zmiany' : 'Stwórz Kolekcję'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}