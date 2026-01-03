export const getDynamicDelay = (word, baseSpeedMs) => {
  if (!word) return baseSpeedMs;
  let delay = baseSpeedMs;
  const length = word.length;

  if (length > 6) delay += (length - 6) * 10;
  if (length > 10) delay += 30;

  if (word.includes('.') || word.includes('?') || word.includes('!')) delay += 150;
  else if (word.includes(',') || word.includes(':') || word.includes(';')) delay += 70;

  return delay;
};

export const wpmToMs = (wpm) => {
  if (!wpm || wpm <= 0) return 0;
  return Math.round(60000 / wpm);
};

export const msToWpm = (ms) => {
  if (!ms || ms <= 0) return 0;
  const rawWpm = 60000 / ms;
  
  const nearestFive = Math.round(rawWpm / 5) * 5;
  
  if (Math.abs(rawWpm - nearestFive) < 2.5) {
    return nearestFive;
  }
  
  return Math.round(rawWpm);
};