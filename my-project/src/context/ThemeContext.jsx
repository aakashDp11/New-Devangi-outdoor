// src/ThemeContext.js
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

const themes = [
  "light",
  "dark",
  "dim",
  "sepia",
  "high-contrast",
  "solarized-dark",
  "solarized-light",
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  // Load saved theme from localStorage (optional)
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  // Apply theme to <html> and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const nextTheme = () => {
    setTheme((prev) => {
      const idx = themes.indexOf(prev);
      return themes[(idx + 1) % themes.length];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, nextTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
