import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Form.module.css";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/login/", form);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      alert("Zalogowano!");
      navigate("/dashboard");
    } catch (err) {
      alert("Błąd logowania");
    }
  };

  return (
    <div className={`container form-container ${styles.formWrapper}`}>
      <h1>Fast Reader</h1>
      <h2>Zaloguj się</h2>
      <p>Witaj z powrotem! Czas poczytać.</p>

<       button className="button-secondary" onClick={() => navigate("/")}>
          ← Powrót 
        </button>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="username">Nazwa użytkownika</label>
        <input
          id="username"
          className="input" // Klasa globalna
          name="username"
          onChange={handleChange}
          placeholder="Wpisz swoją nazwę..."
        />
        
        <label htmlFor="password">Hasło</label>
        <input
          id="password"
          className="input" // Klasa globalna
          name="password"
          type="password"
          onChange={handleChange}
          placeholder="Wpisz swoje hasło..."
        />
        
        <button type="submit" className="button-primary">
          Zaloguj
        </button>
      </form>

      <p className={styles.switchForm}>
        Nie masz konta? <Link to="/register">Zarejestruj się</Link>
      </p>
    </div>
  );
}
