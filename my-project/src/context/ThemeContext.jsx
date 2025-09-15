// ThemeContext.jsx - Updated for scoped theme application
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { themes } from '../config/themes';

const ThemeContext = createContext();
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

// Helper function for contrast calculation
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

export const ThemeProvider = ({ children, scopeSelector = '.themed-container' }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved && themes[saved] ? saved : 'light';
  });
  const [backgroundType, setBackgroundType] = useState(() => 
    localStorage.getItem('app-background-type') || 'solid'
  );
  const [customBackground, setCustomBackground] = useState(() => 
    localStorage.getItem('app-custom-background') || themes.light.background
  );

  const theme = themes[currentTheme];

  // Build theme tokens
  const buildTokens = useCallback((t) => {
    const cardBg = t.cardBg || t.surface;
    const cardText = t.cardText || getContrast(cardBg);
    const chartPrimary = t.chartPrimary || t.primary;
    const chartAccent = t.chartAccent || t.accent || t.primary;
    const chartBg = t.chartBg || t.surface;
    
    return {
      background: t.background,
      primary: t.primary,
      secondary: t.secondary,
      surface: t.surface,
      text: t.text,
      textSecondary: t.textSecondary,
      border: t.border,
      accent: t.accent,
      cardBg, 
      cardText, 
      chartPrimary, 
      chartAccent, 
      chartBg
    };
  }, []);

  // Get background style for the themed container
  const getBackgroundStyle = useCallback((t, bgType, custom) => {
    const base = t.background;
    switch (bgType) {
      case 'solid':
        return { 
          backgroundColor: custom || base, 
          backgroundImage: 'none' 
        };
      case 'gradient':
        return { 
          background: `linear-gradient(135deg, ${t.primary}20, ${t.secondary}20, ${base})`,
          backgroundAttachment: 'fixed' 
        };
      case 'pattern':
        return { 
          backgroundColor: base, 
          backgroundImage: `radial-gradient(circle at 1px 1px, ${t.border}40 1px, transparent 0)`, 
          backgroundSize: '20px 20px' 
        };
      case 'mesh':
        return { 
          background: `conic-gradient(from 0deg at 50% 50%, ${t.primary}15, ${t.secondary}15, ${t.accent}15)`,
          backgroundAttachment: 'fixed' 
        };
      default:
        return { backgroundColor: base };
    }
  }, []);

  // Apply theme only to scoped elements
  const applyTheme = useCallback((themeName, customScopeSelector = null) => {
    if (!themes[themeName]) return;
    
    const t = themes[themeName];
    const tokens = buildTokens(t);
    const targetSelector = customScopeSelector || scopeSelector;

    // Find all elements that should be themed
    const themedElements = document.querySelectorAll(targetSelector);
    
    themedElements.forEach(element => {
      // Apply CSS custom properties to each themed container
      element.style.setProperty('--theme-background', tokens.background);
      element.style.setProperty('--theme-primary', tokens.primary);
      element.style.setProperty('--theme-secondary', tokens.secondary);
      element.style.setProperty('--theme-surface', tokens.surface);
      element.style.setProperty('--theme-text', tokens.text);
      element.style.setProperty('--theme-text-secondary', tokens.textSecondary);
      element.style.setProperty('--theme-border', tokens.border);
      element.style.setProperty('--theme-accent', tokens.accent);
      element.style.setProperty('--theme-card-bg', tokens.cardBg);
      element.style.setProperty('--theme-card-text', tokens.cardText);
      element.style.setProperty('--theme-chart-bg', tokens.chartBg);
      element.style.setProperty('--theme-chart-primary', tokens.chartPrimary);
      element.style.setProperty('--theme-chart-accent', tokens.chartAccent);

      // Apply background style to the themed container
      const bgStyle = getBackgroundStyle(t, backgroundType, customBackground);
      Object.entries(bgStyle).forEach(([key, value]) => {
        element.style[key] = value;
      });
    });

    setCurrentTheme(themeName);
    localStorage.setItem('app-theme', themeName);
  }, [buildTokens, scopeSelector, backgroundType, customBackground, getBackgroundStyle]);

  // Re-apply theme when dependencies change
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      applyTheme(currentTheme);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentTheme, backgroundType, customBackground, applyTheme]);

  // Apply background changes
  const applyBackground = (bgType, bgColor = null) => {
    setBackgroundType(bgType);
    if (bgColor) {
      setCustomBackground(bgColor);
      localStorage.setItem('app-custom-background', bgColor);
    }
    localStorage.setItem('app-background-type', bgType);
  };

  // Re-apply theme to new elements (useful for dynamically added content)
  const applyThemeToElement = useCallback((element) => {
    if (!element) return;
    
    const t = themes[currentTheme];
    const tokens = buildTokens(t);
    
    // Apply CSS custom properties
    element.style.setProperty('--theme-background', tokens.background);
    element.style.setProperty('--theme-primary', tokens.primary);
    element.style.setProperty('--theme-secondary', tokens.secondary);
    element.style.setProperty('--theme-surface', tokens.surface);
    element.style.setProperty('--theme-text', tokens.text);
    element.style.setProperty('--theme-text-secondary', tokens.textSecondary);
    element.style.setProperty('--theme-border', tokens.border);
    element.style.setProperty('--theme-accent', tokens.accent);
    element.style.setProperty('--theme-card-bg', tokens.cardBg);
    element.style.setProperty('--theme-card-text', tokens.cardText);
    element.style.setProperty('--theme-chart-bg', tokens.chartBg);
    element.style.setProperty('--theme-chart-primary', tokens.chartPrimary);
    element.style.setProperty('--theme-chart-accent', tokens.chartAccent);

    // Apply background style
    const bgStyle = getBackgroundStyle(t, backgroundType, customBackground);
    Object.entries(bgStyle).forEach(([key, value]) => {
      element.style[key] = value;
    });
  }, [currentTheme, buildTokens, backgroundType, customBackground, getBackgroundStyle]);

  const backgroundOptions = { 
    solid: 'Solid Color', 
    gradient: 'Gradient', 
    pattern: 'Subtle Pattern', 
    mesh: 'Mesh Gradient' 
  };

  const value = {
    currentTheme,
    theme,
    themes,
    applyTheme,
    applyThemeToElement,
    backgroundType,
    customBackground,
    applyBackground,
    backgroundOptions,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};