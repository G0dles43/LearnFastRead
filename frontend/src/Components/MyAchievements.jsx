import React, { useEffect, useState } from "react";
import axios from "axios";

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
    // Używamy spójnego spinnera
    return (
      <div className="flex justify-center items-center p-8">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    // Używamy klas card z globalnego CSS
    <div className="card card-elevated">
      <h3 className="text-2xl font-bold mb-6">Twoje Osiągnięcia</h3>
      {achievements.length === 0 ? (
        <p className="text-center text-text-secondary py-8">
          Nie masz jeszcze żadnych odznak. Trenuj dalej!
        </p>
      ) : (
        // Używamy responsywnej siatki Tailwind
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((item) => (
            <div 
              key={item.achievement.slug} 
              // Budujemy kartę odznaki za pomocą Tailwind
              className="border border-border bg-background-main rounded-lg p-5 flex flex-col items-center text-center shadow-sm"
            >
              <span className="text-5xl mb-3">{item.achievement.icon_name}</span>
              <h4 className="text-lg font-semibold text-text-primary mb-1">
                {item.achievement.title}
              </h4>
              <p className="text-sm text-text-secondary mb-3">
                {item.achievement.description}
              </p>
              <span className="text-xs text-text-muted mt-auto pt-2">
                Zdobyto: {new Date(item.unlocked_at).toLocaleDateString("pl-PL")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}