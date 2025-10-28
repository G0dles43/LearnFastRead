import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./Components/Login.jsx"; // Użyj .jsx jeśli tak masz
import Register from "./Components/Register.jsx";
import Home from "./Components/Home.jsx";
import Dashboard from "./Components/Dashboard.jsx";
import TrainingSession from "./Components/TrainingSession.jsx";
import Settings from "./Components/Settings.jsx";
import ExerciseCreator from "./Components/ExerciseCreator.jsx";
import Leaderboard from "./Components/Leaderboard.jsx";
import CalibrationSession from "./Components/CalibrationSession.jsx"; 

import axios from "axios";
import { useState, useEffect } from "react"; 

const createAxiosInstance = () => {
  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
  });


  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("access");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => response, 
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; 

        const refreshToken = localStorage.getItem("refresh");

        if (refreshToken) {
          try {
            const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
              refresh: refreshToken
            });

            const newAccessToken = response.data.access;
            localStorage.setItem('access', newAccessToken);

            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

            return axios(originalRequest); 

          } catch (refreshError) {
            console.error("Nie udało się odświeżyć tokenu:", refreshError);
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
             return Promise.reject(refreshError); 
          }
        } else {
          console.log("Brak refresh tokenu, przekierowanie do logowania.");
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
           return Promise.reject(error); 
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
};


function App() {
  const apiInstance = createAxiosInstance(); 
  const navigate = useNavigate(); 

  useEffect(() => {
    const errorInterceptor = apiInstance.interceptors.response.use(
      response => response,
      error => {
        if ((error.config.url === 'http://127.0.0.1:8000/api/token/refresh/' && error.response?.status === 401) ||
            (error.response?.status === 401 && !localStorage.getItem('refresh'))) {
          console.log("Interceptor globalny: Wylogowanie użytkownika.");
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          navigate("/login"); 
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiInstance.interceptors.response.eject(errorInterceptor);
    };
  }, [navigate, apiInstance]);


  return (
    <> 
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login api={apiInstance} />} /> 
        <Route path="/register" element={<Register api={apiInstance} />} />
        <Route path="/dashboard" element={<Dashboard api={apiInstance} />} />
        <Route path="/training/:id" element={<TrainingSession api={apiInstance} />} />
        <Route path="/settings" element={<Settings api={apiInstance} />} />
        <Route path="/create-exercise" element={<ExerciseCreator api={apiInstance} />} />
        <Route path="/ranking" element={<Leaderboard api={apiInstance} />} />
        <Route path="/calibrate" element={<CalibrationSession api={apiInstance} />} />
      </Routes>
    </>
  );
}


function Root() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default Root; 