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

  // Pobieramy kolory z :root CSS, aby wykres pasował do motywu
  const [chartColors, setChartColors] = useState({
    primary: 'rgba(99, 102, 241, 1)',
    primaryTransparent: 'rgba(99, 102, 241, 0.1)',
    secondary: 'rgba(139, 92, 246, 1)',
    secondaryTransparent: 'rgba(139, 92, 246, 0.1)',
    textPrimary: 'rgba(248, 250, 252, 1)',
    textSecondary: 'rgba(148, 163, 184, 1)',
    bgSurface: 'rgba(26, 26, 46, 0.95)',
    border: 'rgba(45, 45, 68, 0.5)',
  });

  useEffect(() => {
    // Czekamy chwilę na załadowanie CSS
    setTimeout(() => {
      const styles = getComputedStyle(document.documentElement);
      setChartColors({
        primary: styles.getPropertyValue('--primary').trim(),
        primaryTransparent: `${styles.getPropertyValue('--primary').trim()}1A`, // ~10% opacity
        secondary: styles.getPropertyValue('--secondary').trim(),
        secondaryTransparent: `${styles.getPropertyValue('--secondary').trim()}1A`, // ~10% opacity
        textPrimary: styles.getPropertyValue('--text-primary').trim(),
        textSecondary: styles.getPropertyValue('--text-secondary').trim(),
        bgSurface: styles.getPropertyValue('--bg-surface').trim(),
        border: styles.getPropertyValue('--border').trim(),
      });
    }, 100);
  }, []);


  useEffect(() => {
    if (!token || !chartColors.primary) return; // Czekamy też na kolory

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
                borderColor: chartColors.primary,
                backgroundColor: chartColors.primaryTransparent,
                borderWidth: 3,
                pointBackgroundColor: chartColors.primary,
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
                borderColor: chartColors.secondary,
                backgroundColor: chartColors.secondaryTransparent,
                borderWidth: 3,
                pointBackgroundColor: chartColors.secondary,
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
  }, [token, chartColors]); // Uruchom ponownie, gdy kolory będą gotowe

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
          color: chartColors.textPrimary,
          font: { size: 13, weight: '600' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      title: {
        display: true,
        text: 'Twoje Postępy w Czasie',
        color: chartColors.textPrimary,
        font: { size: 18, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        backgroundColor: chartColors.bgSurface,
        titleColor: chartColors.textPrimary,
        bodyColor: chartColors.textPrimary,
        borderColor: chartColors.primary,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
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
          color: chartColors.textSecondary,
          font: { size: 12, weight: '600' }
        },
        ticks: {
          color: chartColors.textSecondary,
          font: { size: 11 }
        },
        grid: {
          color: chartColors.border,
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
          color: chartColors.primary,
          font: { size: 12, weight: '600' }
        },
        ticks: {
          color: chartColors.textSecondary,
          font: { size: 11 }
        },
        grid: {
          color: chartColors.border,
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
          color: chartColors.secondary,
          font: { size: 12, weight: '600' }
        },
        ticks: {
          color: chartColors.textSecondary,
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="text-lg text-text-secondary">Ładowanie wykresów postępów...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
            <div className="text-sm text-text-secondary mb-1">Średnie WPM</div>
            <div className="text-3xl font-bold text-text-primary">{stats.avgWpm}</div>
          </div>
          <div className="p-4 rounded-lg border bg-gradient-to-br from-secondary/20 to-secondary/5 border-secondary/30">
            <div className="text-sm text-text-secondary mb-1">Rekord WPM</div>
            <div className="text-3xl font-bold text-text-primary">{stats.maxWpm}</div>
          </div>
          <div className="p-4 rounded-lg border bg-gradient-to-br from-success/20 to-success/5 border-success/30">
            <div className="text-sm text-text-secondary mb-1">Średnia trafność</div>
            <div className="text-3xl font-bold text-text-primary">{stats.avgAccuracy}%</div>
          </div>
          <div className="p-4 rounded-lg border bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30">
            <div className="text-sm text-text-secondary mb-1">Postęp</div>
            <div className="text-3xl font-bold text-text-primary">
              {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
            </div>
          </div>
        </div>
      )}

      <div className="bg-background-elevated shadow-md rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-text-primary">Wizualizacja Postępów</h3>
        </div>

        {chartData ? (
          <div className="relative bg-gradient-to-b from-background-surface/50 to-transparent rounded-xl p-6 border border-border h-[400px]">
            <Line options={options} data={chartData} />
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-background-main rounded-xl border border-border">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="1.5"
              className="mx-auto mb-4 stroke-text-muted"
            >
              <path d="M3 3v18h18" />
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
            </svg>
            <p className="text-lg text-text-secondary mb-2">Brak danych do wyświetlenia</p>
            <p className="text-sm text-text-muted">
              Ukończ więcej ćwiczeń rankingowych, aby zobaczyć swoje postępy!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}