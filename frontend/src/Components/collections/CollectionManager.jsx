import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function CollectionManager({ api }) {
  const [collections, setCollections] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!api) {
        setError("Błąd: Instancja API nie jest dostępna.");
        setLoading(false);
        return;
      }

      try {
        const statusRes = await api.get("user/status/");
        if (!statusRes.data.is_admin) {
          setError("Brak uprawnień. Ta sekcja jest dostępna only dla administratorów.");
          setLoading(false);
          setTimeout(() => navigate("/dashboard"), 3000);
          return;
        }
        setUserStatus(statusRes.data);

        const collectionsRes = await api.get("collections/");
        setCollections(collectionsRes.data);

      } catch (err) {
        console.error("Błąd podczas ładowania danych:", err);
        setError("Nie udało się pobrać danych. Spróbuj odświeżyć stronę.");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [api, navigate]);

  const handleDelete = async (slug, title) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć kolekcję "${title}"? Tej operacji nie można cofnąć.`)) {
      return;
    }

    try {
      await api.delete(`collections/${slug}/`);
      setCollections(prevCollections =>
        prevCollections.filter(col => col.slug !== slug)
      );
    } catch (err) {
      console.error("Błąd usuwania kolekcji:", err);
      alert(`Nie udało się usunąć kolekcji: ${err.response?.data?.detail || err.message}`);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center p-4 md:p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center p-4 md:p-8">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="bg-background-elevated shadow-md rounded-lg p-8 bg-danger/10 border border-danger">
            <h2 className="text-3xl font-bold text-danger mb-4">Błąd Uprawnień</h2>
            <p className="text-lg text-text-secondary">{error}</p>
            {!userStatus?.is_admin && (
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-danger text-text-primary hover:brightness-90 mt-6"
              >
                Powrót do panelu
              </button>
            )}
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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Zarządzanie Kolekcjami
            </h1>
            <p className="text-text-secondary text-lg">
              Twórz, edytuj i usuwaj publiczne kolekcje ćwiczeń.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/manage-collections/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Stwórz nową
            </Link>
            <button
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
              onClick={() => navigate("/dashboard")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Powrót
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-5 animate-fade-in [animation-delay:0.1s]">
          {collections.length === 0 ? (
            <div className="bg-background-elevated shadow-md rounded-lg text-center py-20">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="mx-auto mb-6 stroke-text-muted">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
              <h3 className="text-2xl mb-2">Nie stworzono jeszcze żadnej kolekcji.</h3>
              <p className="text-text-secondary mb-6">Naciśnij "Stwórz nową", aby dodać pierwszą.</p>
            </div>
          ) : (
            collections.map(collection => (
              <div key={collection.id} className="bg-background-elevated shadow-md rounded-lg p-6 flex items-center justify-between gap-6 border border-border hover:border-primary transition-all">
                <div className="flex items-center gap-5">
                  <span className="text-5xl">{collection.icon_name}</span>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">
                      {collection.title}
                      {!collection.is_public && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-background-surface text-text-secondary border border-border-light ml-3">
                          PRYWATNA
                        </span>
                      )}
                    </h2>
                    <p className="text-text-secondary text-sm mb-3">
                      {collection.description || "(Brak opisu)"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                      <span>
                        <strong className="text-text-primary">{collection.exercise_count}</strong> ćwiczeń
                      </span>
                      <span>
                        <strong className="text-text-primary">{collection.total_words}</strong> słów
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 gap-3">
                  <Link
                    to={`/manage-collections/${collection.slug}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edytuj
                  </Link>
                  <button
                    onClick={() => handleDelete(collection.slug, collection.title)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-danger text-text-primary hover:brightness-90"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    Usuń
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}