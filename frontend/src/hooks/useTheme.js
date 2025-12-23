import { useState, useEffect } from 'react';

const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('theme');
    if (typeof storedPrefs === 'string') {
      return storedPrefs;
    }
    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }
  return 'dark';
};

export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  const applyTheme = (themeValue) => {
    const root = window.document.documentElement;
    const isDark = themeValue === 'dark';
    
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(themeValue);
    
    window.localStorage.setItem('theme', themeValue);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
};