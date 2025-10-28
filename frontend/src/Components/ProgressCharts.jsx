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
} from "chart.js";
import styles from "./ProgressCharts.module.css";

// Rejestracja potrzebnych elementów Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ProgressCharts() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access");

  useEffect(() => {
    if (!token) {
        setLoading(false);
        return;
    };

    axios
      .get("http://127.0.0.1:8000/api/user/progress-history/", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const history = res.data;

        if (history.length > 0) {
          // Przygotuj dane dla wykresów
          const labels = history.map(item => 
            new Date(item.completed_at).toLocaleDateString("pl-PL") // Formatuj datę
          );
          const wpmData = history.map(item => item.wpm);
          const accuracyData = history.map(item => item.accuracy);

          setChartData({
            labels,
            datasets: [
              {
                label: "WPM (Słowa na minutę)",
                data: wpmData,
                borderColor: "rgb(54, 162, 235)", // Niebieski
                backgroundColor: "rgba(54, 162, 235, 0.5)",
                yAxisID: 'yWPM', // Przypisz do osi Y dla WPM
                tension: 0.1 // Lekkie wygładzenie linii
              },
              {
                label: "Trafność (%)",
                data: accuracyData,
                borderColor: "rgb(255, 99, 132)", // Czerwony
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                yAxisID: 'yAccuracy', // Przypisz do osi Y dla Trafności
                tension: 0.1
              },
            ],
          });
        } else {
            setChartData(null); // Brak danych do wyświetlenia
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Błąd pobierania historii postępów", err);
        setLoading(false);
      });
  }, [token]);

  // Opcje konfiguracji wykresu (np. tytuły osi)
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Pozwala ustawić własną wysokość
    interaction: {
        mode: 'index', // Pokazuje tooltip dla obu linii naraz
        intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Twoje Postępy w Czasie',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
            // Dodaje jednostki do tooltipa
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.parsed.y;
                    if (context.dataset.yAxisID === 'yAccuracy') {
                        label += '%';
                    }
                }
                return label;
            }
        }
      }
    },
    scales: {
      x: { // Oś X (data)
        title: {
          display: true,
          text: 'Data Ukończenia'
        }
      },
      yWPM: { // Oś Y dla WPM (lewa)
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'WPM'
        },
        beginAtZero: true // Zaczynaj od 0
      },
      yAccuracy: { // Oś Y dla Trafności (prawa)
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Trafność (%)'
        },
        min: 0, // Minimum 0%
        max: 100, // Maksimum 100%

        // Rysuj siatkę tylko dla tej osi
        grid: {
          drawOnChartArea: false, // Nie rysuj siatki w tle wykresu
        },
      },
    },
  };

  if (loading) {
    return <p className={styles.loading}>Ładowanie wykresów postępów...</p>;
  }

  return (
    <div className={styles.chartContainer}>
      <h3>Wizualizacja Postępów</h3>
      {chartData ? (
        <div className={styles.chartWrapper}>
           <Line options={options} data={chartData} />
        </div>
      ) : (
        <p className={styles.emptyState}>Brak wystarczających danych do wyświetlenia wykresów. Ukończ więcej ćwiczeń rankingowych!</p>
      )}
    </div>
  );
}