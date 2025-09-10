import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Palette, 
  Sun, 
  Moon, 
  Droplets, 
  Leaf, 
  Star, 
  Heart, 
  Cpu, 
  Coffee,
  Zap,
  Settings
} from 'lucide-react';

// Icon mapping for themes
const iconMap = {
  Sun,
  Moon,
  Droplets,
  Leaf,
  Star,
  Heart,
  Cpu,
  Coffee,
  Zap,
  Settings
};

// Theme Selector Component
export const ThemeSelector = () => {
  const { currentTheme, themes, applyTheme, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-selector-button flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:opacity-80"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text
        }}
      >
        <Palette size={16} />
        <span className="hidden sm:inline">{themes[currentTheme].name}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border shadow-lg z-50"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border
            }}
          >
            <div className="p-4">
              <h3 className="font-semibold mb-3" style={{ color: theme.text }}>
                Choose Theme
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(themes).map(([key, themeData]) => {
                  const IconComponent = iconMap[themeData.icon] || Settings;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        applyTheme(key);
                        setIsOpen(false);
                      }}
                      className={`theme-option flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                        currentTheme === key ? 'ring-2' : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: currentTheme === key 
                          ? themeData.primary + '20' 
                          : themeData.surface,
                        color: themeData.text,
                        borderColor: themeData.border,
                        ...(currentTheme === key && { 
                          ringColor: themeData.accent
                        })
                      }}
                    >
                      <IconComponent size={20} style={{ color: themeData.primary }} />
                      <span className="text-xs text-center">{themeData.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Background Selector Component
export const BackgroundSelector = () => {
  const { 
    backgroundType, 
    customBackground, 
    applyBackground, 
    backgroundOptions,
    theme
  } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="background-selector-button flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors hover:opacity-80"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text
        }}
      >
        <div 
          className="w-4 h-4 rounded border"
          style={{ backgroundColor: customBackground, borderColor: theme.border }}
        />
        <span className="hidden sm:inline">Background</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="absolute top-full right-0 mt-2 w-72 rounded-lg border shadow-lg z-50"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border
            }}
          >
            <div className="p-4">
              <h3 className="font-semibold mb-3" style={{ color: theme.text }}>
                Background Options
              </h3>
              
              {/* Background Type Selection */}
              <div className="space-y-2 mb-4">
                {Object.entries(backgroundOptions).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => applyBackground(key)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      backgroundType === key ? 'font-medium' : ''
                    }`}
                    style={{
                      backgroundColor: backgroundType === key ? theme.primary + '20' : 'transparent',
                      color: backgroundType === key ? theme.primary : theme.text
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Custom Color Picker for Solid */}
              {backgroundType === 'solid' && (
                <div>
                  <label className="block text-sm mb-2" style={{ color: theme.textSecondary }}>
                    Custom Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customBackground}
                      onChange={(e) => applyBackground('solid', e.target.value)}
                      className="w-full h-10 rounded cursor-pointer border"
                      style={{ borderColor: theme.border }}
                    />
                    <input
                      type="text"
                      value={customBackground}
                      onChange={(e) => applyBackground('solid', e.target.value)}
                      className="flex-1 px-2 py-1 rounded border text-sm"
                      style={{
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                        color: theme.text
                      }}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Combined Theme Controls Component
export const ThemeControls = ({ className = '' }) => {
  return (
    <div className={`theme-controls flex gap-2 ${className}`}>
      <ThemeSelector />
      <BackgroundSelector />
    </div>
  );
};

export default ThemeControls;