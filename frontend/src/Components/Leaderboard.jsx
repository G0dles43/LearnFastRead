import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./Leaderboard.module.css";
import MyAchievements from "./MyAchievements";
import ProgressCharts from "./ProgressCharts.jsx"; 

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leaderboard"); // "leaderboard" lub "mystats"
  
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
      // Pobierz globalną tabelę rankingową
      const leaderboardRes = await axios.get(
        "http://127.0.0.1:8000/api/ranking/leaderboard/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLeaderboard(leaderboardRes.data.leaderboard);

      // Pobierz moje statystyki
      const statsRes = await axios.get(
        "http://127.0.0.1:8000/api/ranking/my-stats/",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Ładowanie rankingu...</p>
      </div>
    );
  }

  return (
    <div className={styles.leaderboardContainer}>
      <header className={styles.header}>
        <h2>🏆 Ranking Fast Reader</h2>
        <button className="button-secondary" onClick={() => navigate("/dashboard")}>
          ← Powrót do panelu
        </button>
      </header>

      {/* Moje statystyki - zawsze na górze */}
      {myStats && (
        <div className={styles.myStatsCard}>
          <h3>Twoja pozycja</h3>
          <div className={styles.myStatsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Miejsce</span>
              <span className={styles.statValue}>{getMedalIcon(myStats.rank)}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Punkty</span>
              <span className={styles.statValue}>{myStats.total_points}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Średnie WPM</span>
              <span className={styles.statValue}>{myStats.average_wpm}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Średnia trafność</span>
              <span className={styles.statValue}>{myStats.average_accuracy}%</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Ukończone</span>
              <span className={styles.statValue}>{myStats.exercises_completed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Zakładki */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "leaderboard" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("leaderboard")}
        >
          🌍 Globalna tabela
        </button>
        <button
          className={`${styles.tab} ${activeTab === "mystats" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("mystats")}
        >
          📊 Moja historia
        </button>
      </div>

      {/* Treść zakładek */}
      {activeTab === "leaderboard" ? (
        <div className={styles.tableContainer}>
          {leaderboard.length > 0 ? (
            <table className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th>Pozycja</th>
                  <th>Użytkownik</th>
                  <th>Punkty</th>
                  <th>Śr. WPM</th>
                  <th>Śr. Trafność</th>
                  <th>Ukończone</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user) => (
                  <tr
                    key={user.rank}
                    className={user.rank <= 3 ? styles.topThree : ""}
                  >
                    <td className={styles.rankCell}>
                      <span className={styles.rankBadge}>
                        {getMedalIcon(user.rank)}
                      </span>
                    </td>
                    <td className={styles.usernameCell}>{user.username}</td>
                    <td className={styles.pointsCell}>{user.total_points}</td>
                    <td>{user.average_wpm}</td>
                    <td>{user.average_accuracy}%</td>
                    <td>{user.exercises_completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <p>Ranking jest jeszcze pusty!</p>
              <p>Bądź pierwszym, który zdobędzie punkty rankingowe! 🚀</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.historyContainer}>
          {myStats && myStats.recent_results.length > 0 ? (
            <>
              <h3>Twoje ostatnie wyniki rankingowe</h3>
              <hr className={styles.divider} /> 
              <ProgressCharts />
              <hr className={styles.divider} /> 
              <MyAchievements />
              <div className={styles.historyList}>
                {myStats.recent_results.map((result, idx) => (
                  <div key={idx} className={styles.historyCard}>
                    <div className={styles.historyHeader}>
                      <h4>{result.exercise_title}</h4>
                      <span className={styles.historyDate}>
                        {new Date(result.completed_at).toLocaleDateString("pl-PL")}
                      </span>
                    </div>
                    <div className={styles.historyStats}>
                      <span className={styles.historyStat}>
                        <strong>{result.wpm}</strong> WPM
                      </span>
                      <span className={styles.historyStat}>
                        <strong>{result.accuracy.toFixed(1)}%</strong> Trafność
                      </span>
                      <span className={styles.historyPoints}>
                        <strong>{result.points}</strong> pkt
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>Nie masz jeszcze wyników rankingowych!</p>
              <p>Ukończ ćwiczenia rankingowe, aby zobaczyć swoją historię.</p>
            </div>
          )}
         
        </div>
      )}
    </div>
  );
}