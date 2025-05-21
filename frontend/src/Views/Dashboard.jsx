import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [exercises, setExercises] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchExercises() {
      const res = await axios.get("http://127.0.0.1:8000/api/exercises/");
      setExercises(res.data);
    }

    fetchExercises();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <button
        onClick={() => {
          localStorage.clear();
          navigate("/");
        }}
      >
        Wyloguj
      </button>
      <button onClick={() => navigate("/settings")}>⚙️ Ustawienia</button>

      <h2>Lista ćwiczeń</h2>
      {exercises.map((ex) => (
        <div
          key={ex.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            margin: "10px 0",
          }}
        >
          <strong>{ex.title}</strong>
          <button
            style={{ marginLeft: "20px" }}
            onClick={() => navigate(`/training/${ex.id}`)}
          >
            Rozpocznij
          </button>
        </div>
      ))}
    </div>
  );
}
