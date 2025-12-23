import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MyAchievements from "./MyAchievements.jsx";
import ProgressCharts from "./ProgressCharts.jsx";
import { jwtDecode } from "jwt-decode";
import LeaderboardTable from "./LeaderboardTable.jsx"; 


export default function Leaderboard({ api }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("my-stats");

  const [friendsLeaderboard, setFriendsLeaderboard] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("access");

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


  useEffect(() => {
    if (!token || !api) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setCurrentUserId(decoded.user_id);
    } catch (e) { console.error("Błąd tokenu"); }

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

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriendsLeaderboard();
    }
  }, [activeTab, fetchFriendsLeaderboard]);

  const getRankBadgeClasses = (rank) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/30 text-white';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg shadow-gray-300/30 text-gray-800';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-yellow-600 shadow-lg shadow-orange-400/30 text-white';
    return 'bg-background-elevated shadow-transparent text-text-primary';
  };
  
  const getMedalIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    if (typeof rank !== 'number') return "?";
    return rank;
  };


  if (loading && activeTab === 'my-stats') {
    return (
      <div className="min-h-screen bg-background-main text-text-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main text-text-primary p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              🏆 Ranking i Społeczność
            </h1>
            <p className="text-text-secondary text-lg">
              Sprawdź swoją pozycję, znajdź znajomych i rywalizuj
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
            onClick={() => navigate("/dashboard")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Powrót
          </button>
        </header>

        {myStats && (
          <div className="bg-background-elevated shadow-md rounded-lg p-8 mb-8 animate-fade-in [animation-delay:0.1s] bg-gradient-to-r from-primary/15 to-secondary/[.05] border-2 border-primary/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
              <div className="flex flex-col items-center justify-center">
                <div className="text-sm text-text-secondary mb-2">Twoja Pozycja</div>
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${getRankBadgeClasses(myStats.rank)}`}
                >
                  {getMedalIcon(myStats.rank)}
                </div>
              </div>
              <div className="p-4 text-center bg-background-surface rounded-lg">
                <div className="text-sm text-text-secondary mb-1">Punkty Łącznie</div>
                <div className="text-3xl font-bold text-warning">{myStats.total_points}</div>
              </div>
              <div className="p-4 text-center bg-background-surface rounded-lg">
                <div className="text-sm text-text-secondary mb-1">Średnie WPM</div>
                <div className="text-3xl font-bold text-text-primary">{myStats.average_wpm}</div>
              </div>
              <div className="p-4 text-center bg-background-surface rounded-lg">
                <div className="text-sm text-text-secondary mb-1">Śr. Trafność</div>
                <div className="text-3xl font-bold text-success">{myStats.average_accuracy}%</div>
              </div>
              <div className="p-4 text-center bg-background-surface rounded-lg">
                <div className="text-sm text-text-secondary mb-1">Ukończone</div>
                <div className="text-3xl font-bold text-text-primary">{myStats.exercises_completed}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-8 border-b-2 border-border animate-fade-in [animation-delay:0.2s]">
          <button
            onClick={() => setActiveTab("my-stats")}
            className={`py-4 px-6 font-semibold transition-all border-b-2 ${activeTab === "my-stats" ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-primary'}`}
          >
            📊 Moja Historia
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`py-4 px-6 font-semibold transition-all border-b-2 ${activeTab === "global" ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-primary'}`}
          >
            🌍 Ranking Globalny
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`py-4 px-6 font-semibold transition-all border-b-2 ${activeTab === "friends" ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-primary'}`}
          >
            👋 Ranking Znajomych
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`py-4 px-6 font-semibold transition-all border-b-2 ${activeTab === "search" ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-primary'}`}
          >
            🔍 Szukaj Użytkowników
          </button>
        </div>

        <div className="animate-fade-in [animation-delay:0.3s]">

          {activeTab === "my-stats" && (
            <div>
              {myStats && myStats.recent_results.length > 0 ? (
                <div className="flex flex-col gap-6">
                  <ProgressCharts />
                  <MyAchievements />
                </div>
              ) : (
                <div className="bg-background-elevated shadow-md rounded-lg text-center p-12">
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
            loading ? <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div> :
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
                  className="block w-full rounded-md border-2 border-border bg-background-main px-4 py-3.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-lg flex-1"
                  placeholder="Wpisz nazwę użytkownika..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light text-lg"
                  disabled={isSearching}
                >
                  {isSearching ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div> : 'Szukaj'}
                </button>
              </form>

              <div className="flex flex-col gap-3">
                {isSearching ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                ) : (
                  searchResults.map(user => (
                    <div key={user.id} className="bg-background-elevated shadow-md rounded-lg p-4 flex justify-between items-center border border-border">
                      <span className="text-lg font-semibold text-text-primary">{user.username}</span>
                      <button
                        onClick={() => handleFollowToggle(user.id, followingIds.includes(user.id))}
                        className={followingIds.includes(user.id)
                          ? "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
                          : "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light"
                        }
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