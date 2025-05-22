import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Witaj!</h1>
      <p>Wybierz jedną z opcji:</p>
      <Link to="/login">
        <button>Zaloguj się</button>
      </Link>
      <br />
      <br />
      <Link to="/register">
        <button>Zarejestruj się</button>
      </Link>
    </div>
  );
}
