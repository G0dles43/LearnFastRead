import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ProgressCharts() {
  const [chartData, setChartData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get("http://127.0.0.1:8000/api/user/progress-history/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const history = res.data;

        if (history.length > 0) {
          const labels = history.map(item => 
            new Date(item.completed_at).toLocaleDateString("pl-PL")
          );
          const wpmData = history.map(item => item.wpm);
          const accuracyData = history.map(item => item.accuracy);

          // Oblicz statystyki
          const avgWpm = Math.round(wpmData.reduce((a, b) => a + b, 0) / wpmData.length);
          const maxWpm = Math.max(...wpmData);
          const avgAccuracy = Math.round(accuracyData.reduce((a, b) => a + b, 0) / accuracyData.length);
          const improvement = wpmData.length > 1 
            ? Math.round(((wpmData[wpmData.length - 1] - wpmData[0]) / wpmData[0]) * 100)
            : 0;

          setStats({ avgWpm, maxWpm, avgAccuracy, improvement, sessionsCount: history.length });

          setChartData({
            labels,
            datasets: [
              {
                label: "WPM (Słowa na minutę)",
                data: wpmData,
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                borderWidth: 3,
                pointBackgroundColor: "rgb(99, 102, 241)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                yAxisID: 'yWPM',
                tension: 0.4,
                fill: true,
              },
              {
                label: "Trafność (%)",
                data: accuracyData,
                borderColor: "rgb(139, 92, 246)",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                borderWidth: 3,
                pointBackgroundColor: "rgb(139, 92, 246)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                yAxisID: 'yAccuracy',
                tension: 0.4,
                fill: true,
              },
            ],
          });
        } else {
          setChartData(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Błąd pobierania historii postępów", err);
        setLoading(false);
      });
  }, [token]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(248, 250, 252)',
          font: { size: 13, weight: '600' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      title: {
        display: true,
        text: 'Twoje Postępy w Czasie',
        color: 'rgb(248, 250, 252)',
        font: { size: 18, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        titleColor: 'rgb(248, 250, 252)',
        bodyColor: 'rgb(248, 250, 252)',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += context.parsed.y;
              if (context.dataset.yAxisID === 'yAccuracy') label += '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Data Ukończenia',
          color: 'rgb(148, 163, 184)',
          font: { size: 12, weight: '600' }
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(45, 45, 68, 0.5)',
          drawBorder: false,
        }
      },
      yWPM: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'WPM',
          color: 'rgb(99, 102, 241)',
          font: { size: 12, weight: '600' }
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(45, 45, 68, 0.5)',
          drawBorder: false,
        },
        beginAtZero: true
      },
      yAccuracy: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Trafność (%)',
          color: 'rgb(139, 92, 246)',
          font: { size: 12, weight: '600' }
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
          font: { size: 11 }
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
          drawBorder: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-3">
          <div className="spinner" />
          <span className="text-lg text-white/70">Ładowanie wykresów postępów...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 border-indigo-500/30">
            <div className="text-sm text-white/60 mb-1">Średnie WPM</div>
            <div className="text-3xl font-bold text-white">{stats.avgWpm}</div>
          </div>
          <div className="card bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
            <div className="text-sm text-white/60 mb-1">Rekord WPM</div>
            <div className="text-3xl font-bold text-white">{stats.maxWpm}</div>
          </div>
          <div className="card bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
            <div className="text-sm text-white/60 mb-1">Średnia trafność</div>
            <div className="text-3xl font-bold text-white">{stats.avgAccuracy}%</div>
          </div>
          <div className="card bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/30">
            <div className="text-sm text-white/60 mb-1">Postęp</div>
            <div className="text-3xl font-bold text-white">
              {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card card-elevated">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
          </div>
          <h3 className="text-2xl font-bold">Wizualizacja Postępów</h3>
        </div>

        {chartData ? (
          <div className="relative bg-gradient-to-b from-white/5 to-transparent rounded-xl p-6 border border-white/10" style={{ height: '400px' }}>
            <Line options={options} data={chartData} />
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-white/5 rounded-xl border border-white/10">
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              className="mx-auto mb-4 text-white/30"
            >
              <path d="M3 3v18h18"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
            </svg>
            <p className="text-lg text-white/60 mb-2">Brak danych do wyświetlenia</p>
            <p className="text-sm text-white/40">
              Ukończ więcej ćwiczeń rankingowych, aby zobaczyć swoje postępy!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}