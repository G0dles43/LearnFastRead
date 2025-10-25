import React, { useEffect, useState } from "react";
import styles from "./ChunkingReader.module.css";

export default function ChunkingReader({ words, currentIndex, chunkSize = 3 }) {
  const [currentChunk, setCurrentChunk] = useState([]);

  useEffect(() => {
    // Oblicz, który chunk pokazać na podstawie currentIndex
    const chunkIndex = Math.floor(currentIndex / chunkSize);
    const startIdx = chunkIndex * chunkSize;
    const endIdx = Math.min(startIdx + chunkSize, words.length);
    
    const chunk = words.slice(startIdx, endIdx);
    setCurrentChunk(chunk);
  }, [currentIndex, words, chunkSize]);

  return (
    <div className={styles.chunkingContainer}>
      <div className={styles.chunkWrapper}>
        {currentChunk.map((word, idx) => (
          <span key={idx} className={styles.chunkWord}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}