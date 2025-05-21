import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/register/", form);
      alert("Rejestracja udana!");
      navigate("/login");
    } catch (err) {
      alert("Błąd rejestracji");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" onChange={handleChange} placeholder="Username" />
      <input name="email" onChange={handleChange} placeholder="Email" />
      <input
        name="password"
        type="password"
        onChange={handleChange}
        placeholder="Hasło"
      />
      <button type="submit">Zarejestruj</button>
    </form>
  );
}
