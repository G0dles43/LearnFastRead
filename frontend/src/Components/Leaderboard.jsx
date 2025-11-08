import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MyAchievements from "./MyAchievements";
import ProgressCharts from "./ProgressCharts.jsx";
import { jwtDecode } from "jwt-decode"; 


const getMedalIcon = (rank) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  if (typeof rank !== 'number') return "?"; 
  return rank;
};

const getRankBadge = (rank) => {
  if (rank <= 3 && typeof rank === 'number') {
    const colors = {
      1: { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', shadow: 'rgba(255, 215, 0, 0.3)' },
      2: { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', shadow: 'rgba(192, 192, 192, 0.3)' },
      3: { bg: 'linear-gradient(135deg, #CD7F32, #B8860B)', shadow: 'rgba(205, 127, 50, 0.3)' }
    };
    return colors[rank];
  }
  return { bg: 'var(--bg-elevated)', shadow: 'transparent' };
};

const LeaderboardTable = ({ users, onFollowToggle, followingIds, currentUserId }) => {
  const API_BASE_URL = "http://127.0.0.1:8000";

  if (users.length === 0) {
    return (
      <div className="text-center py-20 px-6 bg-white/5 rounded-xl border border-white/10">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mx-auto mb-6">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <h3 className="text-2xl mb-2">Ranking jest pusty!</h3>
        <p className="text-text-secondary">
          Nie ma tu jeszcze żadnych wyników.
        </p>
      </div>
    );
  }

  return (
    <div className="card card-elevated overflow-hidden p-0">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Nagłówek Tabeli */}
          <div className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 p-4 border-b border-border text-text-secondary uppercase text-xs font-semibold">
            <span>Pozycja</span>
            <span>Użytkownik</span>
            <span className="text-center">Punkty</span>
            <span className="text-center">Śr. WPM</span>
            <span className="text-center">Trafność</span>
            <span className="text-center">Ukończone</span>
            <span className="text-right">Akcja</span>
          </div>

          {/* Wiersze Tabeli */}
          {users.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-[80px_2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 items-center p-4 border-b border-border transition-colors hover:bg-background-surface-hover"
            >
              {/* Ranga */}
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                style={{
                  background: getRankBadge(user.rank).bg,
                  boxShadow: `0 4px 12px ${getRankBadge(user.rank).shadow}`
                }}
              >
                {getMedalIcon(user.rank)}
              </div>

              {/* Nazwa + Avatar */}
              <div className="flex items-center gap-3">
                <img 
                  src={user.avatar_url || `${API_BASE_URL}/media/avatars/default.png`}
                  alt={`${user.username} avatar`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                  onError={(e) => { 
                    e.target.src = `${API_BASE_URL}/media/avatars/default.png` 
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold">{user.username}</span>
                  {user.id === currentUserId && (
                    <span className="badge badge-primary text-xs">TY</span>
                  )}
                </div>
              </div>

              {/* Staty */}
              <div className="text-center text-lg font-bold text-warning">{user.total_points}</div>
              <div className="text-center text-lg">{user.average_wpm}</div>
              <div className="text-center text-lg">{user.average_accuracy}%</div>
              <div className="text-center text-lg">{user.exercises_completed}</div>

              {/* Przycisk Akcji */}
              <div className="text-right">
                {user.id !== currentUserId && (
                  <button
                    onClick={() => onFollowToggle(user.id, followingIds.includes(user.id))}
                    className={`btn ${followingIds.includes(user.id) ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {followingIds.includes(user.id) ? 'Obserwujesz' : 'Obserwuj'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


// === GŁÓWNY KOMPONENT Leaderboard ===
export default function Leaderboard({ api }) {
  // Stary stan
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Nowy stan zakładek
  const [activeTab, setActiveTab] = useState("my-stats"); 

  // Nowy stan dla znajomych
  const [friendsLeaderboard, setFriendsLeaderboard] = useState([]);
  const [followingIds, setFollowingIds] = useState([]); 
  const [currentUserId, setCurrentUserId] = useState(null);

  // Nowy stan dla wyszukiwarki
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  // --- Funkcja Follow/Unfollow (bez zmian) ---
  const handleFollowToggle = async (userIdToToggle, isCurrentlyFollowing) => {
    if (!api) return;
    
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
    
    try {
      await api.post(`friends/${action}/`, { user_id: userIdToToggle });
      
      if (isCurrentlyFollowing) {
        setFollowingIds(prev => prev.filter(id => id !== userIdToToggle));
      } else {
        setFollowingIds(prev => [...prev, userIdToToggle]);
      }
      
      if (activeTab === 'friends') {
        fetchFriendsLeaderboard();
      }

    } catch (err) {
      console.error(`Błąd podczas ${action}:`, err);
      alert("Wystąpił błąd. Spróbuj ponownie.");
    }
  };

  // --- Funkcja Search (bez zmian) ---
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !api) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.get("users/search/", { params: { q: searchQuery } });
      setSearchResults(res.data);
    } catch (err) {
      console.error("Błąd wyszukiwania:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // --- Funkcja Friends Leaderboard (bez zmian) ---
  const fetchFriendsLeaderboard = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    try {
      const res = await api.get("ranking/leaderboard/friends/");
      setFriendsLeaderboard(res.data.leaderboard);
    } catch (err) {
      console.error("Błąd pobierania rankingu znajomych:", err);
      setError("Nie udało się pobrać rankingu znajomych.");
    } finally {
      setLoading(false);
    }
  }, [api]); 

  
  // --- Główny useEffect (bez zmian) ---
  useEffect(() => {
    if (!token || !api) {
      navigate("/login");
      return;
    }

    try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.user_id);
    } catch (e) { console.error("Błąd tokenu"); } // Ten błąd widziałeś w konsoli

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, leaderboardRes, followingRes] = await Promise.all([
          api.get("ranking/my-stats/"),
          api.get("ranking/leaderboard/"),
          api.get("friends/following/")
        ]);
        
        setMyStats(statsRes.data);
        setLeaderboard(leaderboardRes.data.leaderboard);
        setFollowingIds(followingRes.data);

      } catch (err) {
        console.error("Błąd pobierania danych rankingowych:", err);
        setError("Wystąpił błąd podczas ładowania danych.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [token, navigate, api]);

  // Efekt do ładowania danych zakładek (bez zmian)
  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriendsLeaderboard();
    }
  }, [activeTab, fetchFriendsLeaderboard]);


  if (loading && activeTab === 'my-stats') { 
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  // --- Render (z teraz działającymi helperami) ---
  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header (bez zmian) */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2" style={{ fontSize: '2.5rem' }}>
              🏆 Ranking i Społeczność
            </h1>
            <p className="text-text-secondary text-lg">
              Sprawdź swoją pozycję, znajdź znajomych i rywalizuj
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Powrót
          </button>
        </header>

        {/* Karta Moich Statystyk (teraz zadziała) */}
        {myStats && (
          <div className="card card-elevated animate-fade-in" style={{
            padding: '2rem',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))',
            border: '2px solid rgba(99, 102, 241, 0.3)',
            animationDelay: '0.1s'
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
                <div className="flex flex-col items-center justify-center">
                    <div className="text-sm text-text-secondary mb-2">Twoja Pozycja</div>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: getRankBadge(myStats.rank).bg, // <-- Ta linia powodowała błąd
                        boxShadow: `0 4px 12px ${getRankBadge(myStats.rank).shadow}`, // <-- Ta linia powodowała błąd
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 700
                    }}>
                        {getMedalIcon(myStats.rank)} {/* <-- Ta linia powodowała błąd */}
                    </div>
                </div>
                <div className="card p-4 text-center bg-background-surface">
                    <div className="text-sm text-text-secondary mb-1">Punkty Łącznie</div>
                    <div className="text-3xl font-bold text-warning">{myStats.total_points}</div>
                </div>
                <div className="card p-4 text-center bg-background-surface">
                    <div className="text-sm text-text-secondary mb-1">Średnie WPM</div>
                    <div className="text-3xl font-bold">{myStats.average_wpm}</div>
                </div>
                <div className="card p-4 text-center bg-background-surface">
                    <div className="text-sm text-text-secondary mb-1">Śr. Trafność</div>
                    <div className="text-3xl font-bold text-success">{myStats.average_accuracy}%</div>
                </div>
                <div className="card p-4 text-center bg-background-surface">
                    <div className="text-sm text-text-secondary mb-1">Ukończone</div>
                    <div className="text-3xl font-bold">{myStats.exercises_completed}</div>
                </div>
            </div>
          </div>
        )}

        {/* Zakładki (Tabs) (bez zmian) */}
        <div className="flex gap-1 mb-8 border-b-2 border-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setActiveTab("my-stats")}
            className={`btn-tab ${activeTab === "my-stats" ? 'btn-tab-active' : ''}`}
          >
            📊 Moja Historia
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`btn-tab ${activeTab === "global" ? 'btn-tab-active' : ''}`}
          >
            🌍 Ranking Globalny
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`btn-tab ${activeTab === "friends" ? 'btn-tab-active' : ''}`}
          >
            👋 Ranking Znajomych
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`btn-tab ${activeTab === "search" ? 'btn-tab-active' : ''}`}
          >
            🔍 Szukaj Użytkowników
          </button>
        </div>

        {/* Dynamiczna zawartość zakładek (bez zmian) */}
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          
          {activeTab === "my-stats" && (
            <div>
              {myStats && myStats.recent_results.length > 0 ? (
                <div className="flex flex-col gap-6">
                  <ProgressCharts />
                  <MyAchievements />
                  {/* ... (logika wyświetlania ostatnich wyników) ... */}
                </div>
              ) : (
                <div className="card card-elevated text-center p-12">
                  <h3 className="text-2xl mb-2">Brak historii</h3>
                  <p className="text-text-secondary">Ukończ ćwiczenia rankingowe, aby zobaczyć tu swoje postępy.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "global" && (
            <LeaderboardTable
              users={leaderboard}
              onFollowToggle={handleFollowToggle}
              followingIds={followingIds}
              currentUserId={currentUserId}
            />
          )}

          {activeTab === "friends" && (
            loading ? <div className="spinner mx-auto"></div> :
            <LeaderboardTable
              users={friendsLeaderboard}
              onFollowToggle={handleFollowToggle}
              followingIds={followingIds}
              currentUserId={currentUserId}
            />
          )}

          {activeTab === "search" && (
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                <input
                  type="text"
                  className="input input-lg flex-1"
                  placeholder="Wpisz nazwę użytkownika..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-lg" disabled={isSearching}>
                  {isSearching ? <div className="spinner-small"></div> : 'Szukaj'}
                </button>
              </form>

              <div className="flex flex-col gap-3">
                {isSearching ? (
                  <div className="spinner mx-auto"></div>
                ) : (
                  searchResults.map(user => (
                    <div key={user.id} className="card card-elevated p-4 flex justify-between items-center">
                      <span className="text-lg font-semibold">{user.username}</span>
                      <button
                        onClick={() => handleFollowToggle(user.id, followingIds.includes(user.id))}
                        className={`btn ${followingIds.includes(user.id) ? 'btn-secondary' : 'btn-primary'}`}
                      >
                        {followingIds.includes(user.id) ? 'Obserwujesz' : 'Obserwuj'}
                      </button>
                    </div>
                  ))
                )}
                {!isSearching && searchResults.length === 0 && searchQuery && (
                  <p className="text-center text-text-secondary">Brak wyników dla "{searchQuery}".</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}