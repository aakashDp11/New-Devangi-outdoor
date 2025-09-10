import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes } from '../config/themes';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Load saved theme from localStorage or default to 'light'
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved && themes[saved] ? saved : 'light';
  });

  // Load saved background settings
  const [backgroundType, setBackgroundType] = useState(() => {
    const saved = localStorage.getItem('app-background-type');
    return saved || 'solid';
  });

  const [customBackground, setCustomBackground] = useState(() => {
    const saved = localStorage.getItem('app-custom-background');
    return saved || themes.light.background;
  });

  const theme = themes[currentTheme];

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties for the current theme
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'name' && key !== 'icon') {
        root.style.setProperty(`--color-${key}`, value);
      }
    });

    // Apply background style to body
    const backgroundStyle = getBackgroundStyle();
    Object.entries(backgroundStyle).forEach(([property, value]) => {
      document.body.style[property] = value;
    });

    // Save to localStorage
    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme, backgroundType, customBackground]);

  const applyTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const applyBackground = (bgType, bgColor = null) => {
    setBackgroundType(bgType);
    if (bgColor) {
      setCustomBackground(bgColor);
    }
    localStorage.setItem('app-background-type', bgType);
    if (bgColor) {
      localStorage.setItem('app-custom-background', bgColor);
    }
  };

  const getBackgroundStyle = () => {
    const base = theme.background;
    
    switch (backgroundType) {
      case 'solid':
        return { 
          backgroundColor: customBackground || base,
          backgroundImage: 'none'
        };
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}20, ${base})`,
          backgroundAttachment: 'fixed'
        };
      case 'pattern':
        return {
          backgroundColor: base,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${theme.border}40 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        };
      case 'mesh':
        return {
          background: `conic-gradient(from 0deg at 50% 50%, ${theme.primary}15, ${theme.secondary}15, ${theme.accent}15, ${theme.primary}15)`,
          backgroundAttachment: 'fixed'
        };
      default:
        return { backgroundColor: base };
    }
  };

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
    backgroundType,
    customBackground,
    applyTheme,
    applyBackground,
    getBackgroundStyle,
    backgroundOptions
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};