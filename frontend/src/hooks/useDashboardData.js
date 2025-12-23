import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export function useDashboardData(api) { 
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