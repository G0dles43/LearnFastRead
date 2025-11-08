// src/hooks/useDashboardData.js
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
// Linia "import { useApi }..." musi być USUNIĘTA

// ZMIANA 1: Funkcja przyjmuje 'api' jako argument
export function useDashboardData(api) { 
  // ZMIANA 2: Ta linia jest USUNIĘTA (to ona powodowała błąd)
  // const api = useApi(); 
  const [userStatus, setUserStatus] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      try {
        setLoggedInUserId(jwtDecode(token).user_id);
      } catch (error) {
        console.error("Błąd dekodowania tokenu:", error);
      }
    }

    // ZMIANA 3: Sprawdzamy, czy 'api' zostało przekazane
    if (!api) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      api.get("user/status/"),
      api.get("collections/")
    ]).then(([statusRes, collectionsRes]) => {
      setUserStatus(statusRes.data);
      setCollections(collectionsRes.data);
    }).catch(err => {
      console.error("Nie udało się pobrać danych dashboardu", err);
    }).finally(() => {
      setLoading(false);
    });
  }, [api]); 

  return { userStatus, collections, loggedInUserId, loading };
}