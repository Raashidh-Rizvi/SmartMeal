import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
<<<<<<< HEAD
    // Check local storage for preference, default false (light mode)
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return false;
=======
    return localStorage.getItem('theme') === 'dark';
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

<<<<<<< HEAD
  const toggleTheme = () => setIsDark(!isDark);
=======
  const toggleTheme = () => setIsDark(prev => !prev);
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
