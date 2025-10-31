import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MyAchievements from "./MyAchievements";
import ProgressCharts from "./ProgressCharts.jsx";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leaderboard");
  
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const leaderboardRes = await axios.get(
        "http://127.0.0.1:8000/api/ranking/leaderboard/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaderboard(leaderboardRes.data.leaderboard);

      const statsRes = await axios.get(
        "http://127.0.0.1:8000/api/ranking/my-stats/",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyStats(statsRes.data);
    } catch (err) {
      console.error("Błąd pobierania danych rankingowych:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  const getRankBadge = (rank) => {
    if (rank <= 3) {
      const colors = {
        1: { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', shadow: 'rgba(255, 215, 0, 0.3)' },
        2: { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)', shadow: 'rgba(192, 192, 192, 0.3)' },
        3: { bg: 'linear-gradient(135deg, #CD7F32, #B8860B)', shadow: 'rgba(205, 127, 50, 0.3)' }
      };
      return colors[rank];
    }
    return { bg: 'var(--bg-elevated)', shadow: 'transparent' };
  };

  if (loading) return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%), url("/3.png")',
      backgroundSize: 'cover'
    }}>
      <div className="spinner"></div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.97) 0%, rgba(26, 26, 46, 0.97) 100%), url("/3.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      padding: '2rem'
    }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-gradient mb-2" style={{ fontSize: '2.5rem' }}>
              🏆 Ranking
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Sprawdź swoją pozycję i rywalizuj z innymi
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Powrót
          </button>
        </header>

        {/* My Position Card */}
        {myStats && (
          <div className="card card-elevated animate-fade-in" style={{
            padding: '2rem',
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))',
            border: '2px solid rgba(99, 102, 241, 0.3)',
            animationDelay: '0.1s'
          }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: getRankBadge(myStats.rank).bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 700,
                boxShadow: `0 4px 12px ${getRankBadge(myStats.rank).shadow}`
              }}>
                {getMedalIcon(myStats.rank)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Twoja pozycja</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {myStats.rank <= 3 ? 'Świetna robota!' : 'Trenuj dalej aby wspiąć się wyżej!'}
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1.5rem'
            }}>
              <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--warning), #fbbf24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Punkty
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {myStats.total_points}
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Średnie WPM
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {myStats.average_wpm}
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--success), #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                  </svg>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Trafność
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {myStats.average_accuracy}%
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  margin: '0 auto 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--secondary), #a78bfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Ukończone
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {myStats.exercises_completed}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid var(--border)'
        }} className="animate-fade-in">
          <button
            onClick={() => setActiveTab("leaderboard")}
            style={{
              padding: '1rem 2rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === "leaderboard" ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === "leaderboard" ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '1.05rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              marginBottom: '-2px'
            }}
          >
            🌍 Globalna tabela
          </button>
          <button
            onClick={() => setActiveTab("mystats")}
            style={{
              padding: '1rem 2rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === "mystats" ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === "mystats" ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '1.05rem',
              cursor: 'pointer',
              transition: 'var(--transition)',
              marginBottom: '-2px'
            }}
          >
            📊 Moja historia
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "leaderboard" ? (
          <div className="card card-elevated animate-fade-in">
            {leaderboard.length > 0 ? (
              <div style={{ overflow: 'auto' }}>
                {leaderboard.map((user, idx) => (
                  <div
                    key={user.rank}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 120px 120px 120px 120px',
                      gap: '1.5rem',
                      alignItems: 'center',
                      padding: '1.5rem',
                      borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--border)' : 'none',
                      background: user.rank <= 3 ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = user.rank <= 3 ? 'rgba(99, 102, 241, 0.05)' : 'transparent'}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: getRankBadge(user.rank).bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      boxShadow: `0 4px 12px ${getRankBadge(user.rank).shadow}`
                    }}>
                      {getMedalIcon(user.rank)}
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {user.username}
                      </div>
                      {user.rank <= 3 && (
                        <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                          TOP {user.rank}
                        </span>
                      )}
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Punkty
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>
                        {user.total_points}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        WPM
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {user.average_wpm}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Trafność
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {user.average_accuracy}%
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Ukończone
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {user.exercises_completed}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '5rem 2rem'
              }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 1.5rem' }}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  Ranking jest jeszcze pusty!
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Bądź pierwszym, który zdobędzie punkty rankingowe! 🚀
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {myStats && myStats.recent_results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <ProgressCharts />
                <MyAchievements />
                
                <div className="card card-elevated">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    Ostatnie wyniki rankingowe
                  </h3>
                  <div>
                    {myStats.recent_results.map((result, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1.5rem',
                          borderBottom: idx < myStats.recent_results.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'var(--transition)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <div>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                              {result.exercise_title}
                            </h4>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              {new Date(result.completed_at).toLocaleDateString("pl-PL", { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="badge badge-warning" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            +{result.points} pkt
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                          <div className="card" style={{ padding: '1rem', background: 'var(--bg-main)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              Prędkość
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                              {result.wpm} WPM
                            </div>
                          </div>
                          <div className="card" style={{ padding: '1rem', background: 'var(--bg-main)' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              Trafność
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                              {result.accuracy.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card card-elevated" style={{
                textAlign: 'center',
                padding: '5rem 2rem'
              }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 1.5rem' }}>
                  <path d="M3 3v18h18"/>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                </svg>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  Nie masz jeszcze wyników rankingowych!
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Ukończ ćwiczenia rankingowe, aby zobaczyć swoją historię.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}