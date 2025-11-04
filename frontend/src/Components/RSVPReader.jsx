import React from "react";

export default function RSVPReader({ currentWord }) {
  return (
    <div className="card card-elevated min-h-[400px] min-w-[90%] flex items-center justify-center">
      <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] tracking-wide">
        {currentWord || "●●●"}
      </h1>
    </div>
  );
}