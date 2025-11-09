import React from "react";

export default function RSVPReader({ currentWord }) {
  return (
    <div className=" min-h-[400px] min-w-[90%] flex items-center justify-center">
      <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-text-primary tracking-wide">
        {currentWord || "●●●"}
      </h1>
    </div>
  );
}