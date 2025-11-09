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
      <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && !isSubmitting) {
    return (
      <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center p-4">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="bg-background-surface rounded-md shadow-md p-8 bg-danger/10 border border-danger">
            <h2 className="text-3xl font-bold text-danger mb-4">Błąd</h2>
            <p className="text-lg text-text-secondary whitespace-pre-line">{error}</p>
            <button
              onClick={() => navigate("/manage-collections")}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-text-primary transition-colors bg-danger hover:bg-danger-hover mt-6"
            >
              Powrót do listy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main text-text-primary p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent mb-2">
              {isEditMode ? 'Edytuj Kolekcję' : 'Stwórz Kolekcję'}
            </h1>
            <p className="text-text-secondary text-lg">
              {isEditMode ? `Edytujesz "${title}"` : 'Wypełnij dane nowej kolekcji'}
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-colors bg-background-surface hover:bg-background-surface-hover border border-border text-text-primary"
            onClick={() => navigate("/manage-collections")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Anuluj
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && isSubmitting && (
            <div className="bg-background-surface rounded-md p-4 bg-danger/10 border border-danger text-danger font-medium whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="bg-background-surface rounded-md shadow-md p-6">
            <h3 className="text-xl font-semibold mb-6">Podstawowe Informacje</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Tytuł</label>
                <input
                  type="text"
                  className="block w-full rounded-md border-border bg-background-main p-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:ring-primary-dark"
                  placeholder="np. Historia Polski"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Ikona (Emoji)</label>
                <input
                  type="text"
                  className="block w-full rounded-md border-border bg-background-main p-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:ring-primary-dark"
                  placeholder="📚"
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  maxLength={5}
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-text-secondary mb-1">Opis</label>
              <textarea
                className="block w-full rounded-md border-border bg-background-main p-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:ring-primary-dark"
                placeholder="Krótki opis kolekcji..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="mt-6">
              <label className="flex items-center gap-3 p-4 rounded-lg bg-background-main border border-border cursor-pointer hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary-dark"
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

          <div className="bg-background-surface rounded-md shadow-md p-6">
            <h3 className="text-xl font-semibold mb-6">Ćwiczenia w Kolekcji</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Dostępne ćwiczenia</label>
                <input
                  type="text"
                  className="block w-full rounded-md border-border bg-background-main p-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:ring-primary-dark mb-3"
                  placeholder="Filtruj ćwiczenia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="h-80 overflow-y-auto border border-border rounded-lg bg-background-main p-2 space-y-2">
                  {availableExercises.length > 0 ? (
                    availableExercises.map(ex => (
                      <div key={ex.id} className="flex items-center justify-between p-2 rounded hover:bg-background-surface-hover">
                        <span className="text-sm">{ex.title}</span>
                        <button
                          type="button"
                          title="Dodaj do kolekcji"
                          onClick={() => addExerciseToCollection(ex.id)}
                          className="inline-flex items-center justify-center rounded-md p-1 font-semibold transition-colors text-primary hover:bg-background-surface-hover"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-text-secondary text-sm text-center p-4">Brak dostępnych ćwiczeń lub wszystkie zostały dodane.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  W tej kolekcji ({selectedExercises.length})
                </label>
                <div className="h-[23.5rem] overflow-y-auto border border-primary/50 rounded-lg bg-background-surface p-2 space-y-2">
                  {selectedExercises.length > 0 ? (
                    selectedExercises.map(ex => (
                      <div key={ex.id} className="flex items-center justify-between p-2 rounded hover:bg-background-surface-hover">
                        <span className="text-sm font-semibold">{ex.title}</span>
                        <button
                          type="button"
                          title="Usuń z kolekcji"
                          onClick={() => removeExerciseFromCollection(ex.id)}
                          className="inline-flex items-center justify-center rounded-md p-1 font-semibold transition-colors text-danger hover:bg-background-surface-hover"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
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
              className="inline-flex items-center justify-center rounded-md font-semibold transition-colors px-6 py-3 text-lg bg-primary text-text-primary hover:bg-primary-hover disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div>
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