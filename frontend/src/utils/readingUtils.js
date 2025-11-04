
/**
@param {string} word - Aktualne słowo.
@param {number} baseSpeedMs - Bazowe opóźnienie (w milisekundach) obliczone z WPM.
@returns {number} - Skorygowane opóźnienie w milisekundach.
 */

export const getDynamicDelay = (word, baseSpeedMs) => {
  const minTime = baseSpeedMs * 0.75; 
  const maxTime = baseSpeedMs * 1.5;  
  const bonusPerChar = baseSpeedMs / 10; 

  let delay;
  if (!word || word.length <= 4) {
    delay = minTime; 
  } else {
    delay = minTime + (word.length - 4) * bonusPerChar;
  }

  return Math.max(minTime, Math.min(delay, maxTime)); 
};