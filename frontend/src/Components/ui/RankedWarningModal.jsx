import React from "react";
import { Link } from "react-router-dom";

export default function RankedWarningModal({ show, exercise, onClose, onConfirm }) {
  if (!show || !exercise) return null;

  return (
    <div className="fixed inset-0 bg-background-main/80 backdrop-blur-lg flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-background-elevated shadow-xl rounded-lg border border-border max-w-2xl animate-slide-in p-8">
        <h2 className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-3xl font-bold mb-4">
          🏆 Uwaga: Ćwiczenie Rankingowe!
        </h2>
        <p className="text-lg text-text-secondary mb-4">
          Tekst, który chcesz uruchomić (<strong className="text-text-primary">{exercise.title}</strong>), jest rankingowy.
        </p>
        <ul className="list-disc pl-6 my-6 space-y-3 text-text-primary">
          <li>
            Twój wynik zostanie zapisany tylko jeśli osiągniesz <strong>min. 60% poprawności</strong> w quizie.
          </li>
          <li>
            Wynik można poprawić dopiero <strong>po 30 dniach</strong> od ukończenia.
          </li>
          <li>
            Upewnij się, że masz chwilę spokoju. Powodzenia!
          </li>
          <li className="text-warning font-semibold">
            Absolutnie nie wolno oszukiwać!
          </li>
        </ul>

        <p className="text-text-secondary mb-6">
          Chcesz dowiedzieć się więcej o grach rankingowych?
          <Link to="/how-it-works" className="text-primary font-semibold ml-1 hover:text-primary-hover">
            Kliknij tutaj
          </Link>.
        </p>

        <div className="flex gap-4 justify-end">
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all bg-background-surface text-text-primary border border-border-light hover:bg-background-surface-hover hover:border-primary"
            onClick={onClose}
          >
            Anuluj
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-primary to-primary-light"
            onClick={onConfirm}
          >
            Rozumiem, rozpocznij
          </button>
        </div>
      </div>
    </div>
  );
}