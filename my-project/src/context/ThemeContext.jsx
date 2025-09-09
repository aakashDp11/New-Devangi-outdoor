import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

// ✅ Must match tailwind.config.js daisyui.themes
const themes = [
  "light",
  "dark",
  "cupcake",
  "corporate",
  "forest",
  "dracula",
  "autumn",
  "lofi",
  "pastel",
  "fantasy",
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved && themes.includes(saved)) {
      setTheme(saved);
    }
  }, []);

  // Apply theme to <html> and persist
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
