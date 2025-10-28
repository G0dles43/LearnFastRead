import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./MyAchievements.module.css";

export default function MyAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) return;

    axios
      .get("http://127.0.0.1:8000/api/user/achievements/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setAchievements(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Błąd pobierania osiągnięć", err);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <p>Ładowanie osiągnięć...</p>;
  }

  return (
    <div className={styles.achievementsContainer}>
      <h3>Twoje Osiągnięcia</h3>
      {achievements.length === 0 ? (
        <p className={styles.emptyState}>Nie masz jeszcze żadnych odznak. Trenuj dalej!</p>
      ) : (
        <div className={styles.grid}>
          {achievements.map((item) => (
            <div key={item.achievement.slug} className={styles.card}>
              <span className={styles.icon}>{item.achievement.icon_name}</span>
              <h4 className={styles.title}>{item.achievement.title}</h4>
              <p className={styles.description}>{item.achievement.description}</p>
              <span className={styles.date}>
                Zdobyto: {new Date(item.unlocked_at).toLocaleDateString("pl-PL")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}