import React from "react";
import { Link } from "react-router-dom";

export default function RankedWarningModal({ show, exercise, onClose, onConfirm }) {
  if (!show || !exercise) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
      <div className="card card-elevated max-w-2xl animate-slide-in p-8">
        <h2 className="text-gradient text-3xl font-bold mb-4">
          🏆 Uwaga: Ćwiczenie Rankingowe!
        </h2>
        <p className="text-lg text-text-secondary mb-4">
          Tekst, który chcesz uruchomić (<strong className="text-white">{exercise.title}</strong>), jest rankingowy.
        </p>
        <ul className="list-disc pl-6 my-6 space-y-3">
          <li>
            Twój wynik zostanie zapisany tylko jeśli osiągniesz <strong>min. 60% poprawności</strong> w quizie.
          </li>
          <li>
            Wynik można poprawić dopiero <strong>po 30 dniach</strong> od zaliczenia.
          </li>
          <li>
            Upewnij się, że masz chwilę spokoju. Powodzenia!
          </li>
        </ul>

        <p className="text-text-secondary mb-6">
          Chcesz dowiedzieć się więcej o pointacji?
          <Link to="/how-it-works" className="text-primary font-semibold ml-1">
            Kliknij tutaj
          </Link>.
        </p>

        <div className="flex gap-4 justify-end">
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Anuluj
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
          >
            Rozumiem, rozpocznij
          </button>
        </div>
      </div>
    </div>
  );
}