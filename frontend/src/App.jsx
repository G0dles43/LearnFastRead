import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./Components/Login.jsx"; 
import Register from "./Components/Register.jsx";
import Home from "./Components/Home.jsx";
import Dashboard from "./Components/Dashboard.jsx";
import TrainingSession from "./Components/TrainingSession.jsx";
import Settings from "./Components/Settings.jsx";
import ExerciseCreator from "./Components/ExerciseCreator.jsx";
import Leaderboard from "./Components/Leaderboard.jsx";
import CalibrationSession from "./Components/CalibrationSession.jsx";
import HowItWorks from "./Components/HowItWorks.jsx";
import CollectionManager from "./Components/CollectionManager.jsx";
import CollectionForm from "./Components/CollectionForm.jsx";
import CollectionDetail from "./Components/CollectionDetail.jsx";
import Profile from "./Components/Profile.jsx";

import axios from "axios";
import { useState, useEffect } from "react"; 

import { GoogleOAuthProvider } from "@react-oauth/google";


const GOOGLE_CLIENT_ID = "11078447520-dmlr36fl2dd6acetjjdosi56ba8qksn2.apps.googleusercontent.com";


function CalibrationGuard({ children }) {
  const { user, userStatus, setUserStatus } = useAuth(); // Zakładam, że masz coś takiego
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Jeśli user jest zalogowany, ale nie mamy jeszcze jego statusu
    if (user && !userStatus) {
      api.get('user/status/')
        .then(res => {
          setUserStatus(res.data); // Zapisz status globalnie
        })
        .catch(err => console.error("Nie udało się pobrać statusu", err));
    }

    // GŁÓWNA LOGIKA STRAŻNIKA
    if (userStatus) {
      const needsCalibration = !userStatus.has_completed_calibration;
      const isTryingToCalibrate = location.pathname.includes('/ustawienia'); // lub /kalibracja

      if (needsCalibration && !isTryingToCalibrate) {
        // Jeśli potrzebuje kalibracji, ale jest na innej stronie -> WYMUSZ PRZEKIEROWANIE
        navigate('/ustawienia', { replace: true });
        
      } else if (!needsCalibration && isTryingToCalibrate) {
        // (Opcjonalne) Jeśli jest już po kalibracji i wejdzie na /ustawienia,
        // a Ty chcesz go przenieść, możesz to zrobić, ale lepiej mu pozwolić zostać.
      }
    }
  }, [user, userStatus, location.pathname, navigate, setUserStatus]);

  // Jeśli potrzebuje kalibracji, nie renderuj reszty apki, dopóki nie jest na /ustawienia
  if (userStatus && !userStatus.has_completed_calibration && !location.pathname.includes('/ustawienia')) {
    return <div className="spinner"></div>; // Pokaż loader podczas przekierowania
  }

  // W przeciwnym razie, renderuj normalnie
  return children;
}

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
          <Route path="/profile" element={<Profile api={apiInstance} />} />
          
          <Route path="/dashboard" element={<Dashboard api={apiInstance} />} />
          <Route path="/training/:id" element={<TrainingSession api={apiInstance} />} />
          <Route path="/settings" element={<Settings api={apiInstance} />} />
          <Route path="/create-exercise" element={<ExerciseCreator api={apiInstance} />} />
          <Route path="/edit-exercise/:id" element={<ExerciseCreator api={apiInstance} />} />
          <Route path="/ranking" element={<Leaderboard api={apiInstance} />} />
          <Route path="/calibrate" element={<CalibrationSession api={apiInstance} />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/manage-collections" element={<CollectionManager api={apiInstance} />} />
          <Route path="/manage-collections/new" element={<CollectionForm api={apiInstance} />} />
          <Route path="/manage-collections/:slug" element={<CollectionForm api={apiInstance} />} />
          <Route path="/collections/:slug" element={<CollectionDetail api={apiInstance} />} />
        </Routes>
    </>
  );
}


function Root() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default Root;