import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./Views/Login";
import Register from "./Views/Register";
import Home from "./Views/Home";
import Dashboard from "./Views/Dashboard";
import TrainingSession from "./Views/TrainingSession";
import Settings from "./Views/Settings";

function App() {
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
