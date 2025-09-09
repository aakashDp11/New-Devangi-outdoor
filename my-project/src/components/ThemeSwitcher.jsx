import React, { useEffect, useState } from "react";

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
  "fantasy"
];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      className="select select-bordered w-full max-w-xs"
    >
      {themes.map((t) => (
        <option key={t} value={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  );
}
