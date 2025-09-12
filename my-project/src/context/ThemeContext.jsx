// ThemeContext.jsx  (replace / integrate with your existing file)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { themes } from '../config/themes';

const ThemeContext = createContext();
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

// tiny contrast helper (returns '#000' or '#fff')
function hexToRgb(hex) {
  const c = hex.replace('#','').trim();
  const bigint = parseInt(c.length === 3
    ? c.split('').map(ch => ch+ch).join('')
    : c, 16);
  return { r: (bigint>>16)&255, g:(bigint>>8)&255, b:bigint&255 };
}
function getContrast(hex) {
  try {
    const { r,g,b } = hexToRgb(hex);
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    return luminance > 0.6 ? '#000000' : '#ffffff';
  } catch(e){ return '#ffffff'; }
}

export const ThemeProvider = ({ children, defaultScope = ':root' }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved && themes[saved] ? saved : 'light';
  });
  const [backgroundType, setBackgroundType] = useState(() => localStorage.getItem('app-background-type') || 'solid');
  const [customBackground, setCustomBackground] = useState(() => localStorage.getItem('app-custom-background') || themes.light.background);

  const theme = themes[currentTheme];

  // Build derived tokens for consistent usage
  const buildTokens = useCallback((t) => {
    const cardBg = t.cardBg || t.surface;
    const cardText = t.cardText || getContrast(cardBg);
    const chartPrimary = t.chartPrimary || t.primary;
    const chartAccent = t.chartAccent || t.accent || t.primary;
    const chartBg = t.chartBg || t.surface;
    return {
      // global
      background: t.background,
      primary: t.primary,
      secondary: t.secondary,
      text: t.text,
      textSecondary: t.textSecondary,
      border: t.border,
      accent: t.accent,
      // scoped/foreground
      cardBg, cardText, chartPrimary, chartAccent, chartBg
    };
  }, []);

  // Compose background style (same as your getBackgroundStyle but returned here)
  const getBackgroundStyle = useCallback((t, bgType, custom) => {
    const base = t.background;
    switch (bgType) {
      case 'solid':
        return { backgroundColor: custom || base, backgroundImage: 'none' };
      case 'gradient':
        return { background: `linear-gradient(135deg, ${t.primary}20, ${t.secondary}20, ${base})`, backgroundAttachment: 'fixed' };
      case 'pattern':
        return { backgroundColor: base, backgroundImage: `radial-gradient(circle at 1px 1px, ${t.border}40 1px, transparent 0)`, backgroundSize: '20px 20px' };
      case 'mesh':
        return { background: `conic-gradient(from 0deg at 50% 50%, ${t.primary}15, ${t.secondary}15, ${t.accent}15)`, backgroundAttachment: 'fixed' };
      default:
        return { backgroundColor: base };
    }
  }, []);

  // applyTheme: writes CSS vars.
  // scopeSelector controls where "foreground" (cards/charts) variables go.
  const applyTheme = useCallback((themeName, scopeSelector = defaultScope) => {
    if (!themes[themeName]) return;
    const t = themes[themeName];
    const tokens = buildTokens(t);

    // Write global vars onto :root (page-level)
    const root = document.documentElement;
    root.style.setProperty('--color-background', tokens.background);
    root.style.setProperty('--color-primary', tokens.primary);
    root.style.setProperty('--color-secondary', tokens.secondary);
    root.style.setProperty('--color-text', tokens.text);
    root.style.setProperty('--color-textSecondary', tokens.textSecondary);
    root.style.setProperty('--color-border', tokens.border);
    root.style.setProperty('--color-accent', tokens.accent);

    // Write foreground tokens to the scope element (so foreground can be scoped)
    const scopeEl = scopeSelector === ':root' ? document.documentElement : document.querySelector(scopeSelector);
    if (scopeEl) {
      scopeEl.style.setProperty('--color-surface', t.surface);
      scopeEl.style.setProperty('--color-card-bg', tokens.cardBg);
      scopeEl.style.setProperty('--color-card-text', tokens.cardText);
      scopeEl.style.setProperty('--color-chart-bg', tokens.chartBg);
      scopeEl.style.setProperty('--color-chart-primary', tokens.chartPrimary);
      scopeEl.style.setProperty('--color-chart-accent', tokens.chartAccent);
    }

    // Apply body background patterns globally (so page BG follows theme/background type)
    const bgStyle = getBackgroundStyle(t, backgroundType, customBackground);
    Object.entries(bgStyle).forEach(([k,v]) => { document.body.style[k] = v; });

    setCurrentTheme(themeName);
    localStorage.setItem('app-theme', themeName);
  }, [buildTokens, defaultScope, backgroundType, customBackground, getBackgroundStyle]);

  // When currentTheme/backgroundType/customBackground change, re-apply using default behaviour
  useEffect(() => {
    // Apply global background and set CSS vars (scoped to defaultScope)
    applyTheme(currentTheme, defaultScope);
  }, [currentTheme, backgroundType, customBackground, applyTheme, defaultScope]);

  const applyBackground = (bgType, bgColor = null) => {
    setBackgroundType(bgType);
    if (bgColor) setCustomBackground(bgColor);
    localStorage.setItem('app-background-type', bgType);
    if (bgColor) localStorage.setItem('app-custom-background', bgColor);
    // re-apply theme so body background updates
    applyTheme(currentTheme, defaultScope);
  };

  const backgroundOptions = { solid: 'Solid Color', gradient: 'Gradient', pattern: 'Subtle Pattern', mesh: 'Mesh Gradient' };

  const value = {
    currentTheme,
    theme,
    themes,
    applyTheme,
    backgroundType,
    customBackground,
    applyBackground,
    backgroundOptions,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
