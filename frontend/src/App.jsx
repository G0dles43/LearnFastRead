import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Home from "./Components/Home";
import Dashboard from "./Components/Dashboard";
import TrainingSession from "./Components/TrainingSession";
import Settings from "./Components/Settings";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function App() {
  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/training" element={<TrainingSession />} />
          <Route path="/training/:id" element={<TrainingSession />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
