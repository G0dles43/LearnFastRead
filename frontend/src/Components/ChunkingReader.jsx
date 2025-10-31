import React, { useEffect, useState } from "react";

export default function ChunkingReader({ words, currentIndex, chunkSize = 3 }) {
  const [currentChunk, setCurrentChunk] = useState([]);

  useEffect(() => {
    const chunkIndex = Math.floor(currentIndex / chunkSize);
    const startIdx = chunkIndex * chunkSize;
    const endIdx = Math.min(startIdx + chunkSize, words.length);
    
    setCurrentChunk(words.slice(startIdx, endIdx));
  }, [currentIndex, words, chunkSize]);

  const wordInChunkIndex = currentIndex % chunkSize;

  return (
    <div className="min-h-[300px] flex items-center justify-center">
      <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
        {currentChunk.map((word, idx) => (
          <span
            key={`${word}-${idx}`}
            className={`
              'font-semibold transition-all duration-200'
              'text-3xl md:text-5xl text-white' 
            `}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}