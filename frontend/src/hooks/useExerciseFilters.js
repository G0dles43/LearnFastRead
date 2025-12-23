import { useState, useEffect } from 'react';

export function useExerciseFilters(api, initialSort = '-created_at') {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    favorites: false,
    ranked: false,
    my_private: false,
  });
  const [sortBy, setSortBy] = useState(initialSort);

  useEffect(() => {
    if (!api) {
      setLoading(false);
      return;
    }

    async function fetchExercises() {
      setLoading(true);
      const params = { ...filterOptions, sort_by: sortBy };
      Object.keys(params).forEach(key => {
        if (key === 'favorites' || key === 'ranked' || key === 'my_private') {
          if (params[key] === true) params[key] = 'true';
          else delete params[key];
        }
      });

      try {
        const res = await api.get("exercises/", { params });
        setExercises(res.data);
      } catch (err) {
        console.error("Błąd pobierania ćwiczeń:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchExercises();
  }, [api, filterOptions, sortBy]); 

  const toggleFavorite = async (id) => {
    if (!api) return;
    try {
      await api.post(`exercises/${id}/favorite/`, {});
      setExercises(prev =>
        prev.map(ex =>
          ex.id === id ? { ...ex, is_favorite: !ex.is_favorite } : ex
        ).filter(ex => filterOptions.favorites ? ex.is_favorite : true) 
      );
    } catch (err) {
      console.error("Błąd aktualizacji ulubionych:", err);
    }
  };

  const deleteExercise = async (id) => {
    if (!api || !window.confirm("Czy na pewno chcesz usunąć to ćwiczenie?")) return;
    try {
      await api.delete(`exercises/${id}/`);
      setExercises(prev => prev.filter(ex => ex.id !== id));
    } catch (err) {
      console.error("Błąd usuwania ćwiczenia:", err);
    }
  };

  const handleFilterChange = (filterName) => {
    setFilterOptions(prev => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  const handleSortChange = (value) => {
    setSortBy(value);
  };

  return {
    exercises,
    loading: loading,
    filterOptions,
    sortBy,
    toggleFavorite,
    deleteExercise,
    handleFilterChange,
    handleSortChange
  };
}