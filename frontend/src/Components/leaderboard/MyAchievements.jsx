import React, { useEffect, useState } from "react";
import axios from "axios";

const ACHIEVEMENT_CONFIG = {
  'wpm_300': { icon: '⚡', color: 'text-yellow-400', label: 'Speedster (300 WPM)' },
  'wpm_800': { icon: '🚀', color: 'text-red-500', label: 'Supersonic (800 WPM)' },
  'accuracy_100': { icon: '🎯', color: 'text-green-500', label: 'Snajper (100% Acc)' },
  'marathoner': { icon: '🏃', color: 'text-blue-400', label: 'Maratończyk (>800 słów)' },
  'daily_challenger': { icon: '🔥', color: 'text-orange-500', label: 'Bohater Dnia' },
};

export default function MyAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredAchievement, setHoveredAchievement] = useState(null);
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) return;
    
    axios.get("http://127.0.0.1:8000/api/user/achievements/", {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        setAchievements(res.data);
        setLoading(false);
    })
    .catch(err => {
        console.error("Błąd pobierania osiągnięć", err);
        setLoading(false);
    });
  }, [token]);

  if (loading) {
    return <div className="animate-pulse h-24 bg-background-elevated rounded-lg"></div>;
  }

  if (achievements.length === 0) {
    return (
        <div className="bg-background-elevated shadow-md rounded-lg border border-border p-6 text-center">
            <h3 className="text-xl font-bold mb-2 text-text-primary">Twoje Osiągnięcia</h3>
            <p className="text-text-secondary text-sm">
                Jeszcze nie zdobyłeś żadnych odznak. Trenuj dalej!
            </p>
            <div className="flex justify-center gap-4 mt-4 opacity-30 grayscale">
                <span className="text-3xl">⚡</span>
                <span className="text-3xl">🎯</span>
                <span className="text-3xl">🔥</span>
            </div>
        </div>
    );
  }

  return (
    <div className="bg-background-elevated shadow-md rounded-lg border border-border p-6">
      <h3 className="text-xl font-bold mb-4 text-text-primary flex items-center gap-2">
        <span>🏅</span> Twoje Osiągnięcia
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
        {achievements.map((userAch) => {
            const config = ACHIEVEMENT_CONFIG[userAch.achievement.slug] || { 
                icon: '🏆', 
                color: 'text-primary', 
                label: userAch.achievement.title 
            };

            return (
                <div 
                    key={userAch.achievement.slug} 
                    className="group relative flex flex-col items-center justify-center p-4 bg-background-surface rounded-lg border border-border transition-all hover:scale-105 hover:shadow-lg cursor-help"
                    onMouseEnter={() => setHoveredAchievement(userAch.achievement.slug)}
                    onMouseLeave={() => setHoveredAchievement(null)}
                >
                    <div className={`text-4xl mb-2 ${config.color} drop-shadow-sm transition-transform group-hover:scale-110`}>
                        {config.icon}
                    </div>
                    <div className="text-xs font-bold text-center text-text-primary">
                        {userAch.achievement.title}
                    </div>
                    <div className="text-[10px] text-text-secondary mt-1">
                        {new Date(userAch.unlocked_at).toLocaleDateString()}
                    </div>

                    <div className={`
                        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 
                        bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 
                        whitespace-normal max-w-xs text-center
                        transition-all duration-200
                        ${hoveredAchievement === userAch.achievement.slug 
                            ? 'opacity-100 translate-y-0 pointer-events-none' 
                            : 'opacity-0 translate-y-2 pointer-events-none'}
                    `}>
                        <div className="font-semibold mb-1">{userAch.achievement.title}</div>
                        <div className="text-[10px] opacity-90">{userAch.achievement.description}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}