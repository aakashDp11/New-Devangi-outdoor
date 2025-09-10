import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

// ✅ Must match tailwind.config.js daisyui.themes
const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
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

  // Apply theme to <html> only and persist
  useEffect(() => {
    // ✅ Always set theme on <html>
    document.documentElement.setAttribute("data-theme", theme);

    // ❌ Ensure <body> never carries theme (prevents override)
    if (document.body.hasAttribute("data-theme")) {
      document.body.removeAttribute("data-theme");
    }

    // Save in localStorage
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
