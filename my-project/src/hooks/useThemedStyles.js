// useThemedComponent.js - Hook for applying themes to specific components
import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Custom hook for applying themes to specific DOM elements
 * @param {boolean} autoApply - Whether to automatically apply theme on mount
 * @returns {Object} Theme utilities
 */
export const useThemedComponent = (autoApply = true) => {
  const { applyThemeToElement, currentTheme, theme } = useTheme();
  const elementRef = useRef(null);

  // Auto-apply theme when component mounts or theme changes
  useEffect(() => {
    if (autoApply && elementRef.current) {
      applyThemeToElement(elementRef.current);
    }
  }, [autoApply, currentTheme, applyThemeToElement]);

  // Manual theme application function
  const applyTheme = (element = null) => {
    const targetElement = element || elementRef.current;
    if (targetElement) {
      applyThemeToElement(targetElement);
    }
  };

  // Helper to create themed style objects
  const getThemedStyles = () => ({
    background: theme.background,
    surface: theme.surface,
    primary: theme.primary,
    secondary: theme.secondary,
    text: theme.text,
    textSecondary: theme.textSecondary,
    border: theme.border,
    accent: theme.accent,
  });

  return {
    elementRef,
    applyTheme,
    currentTheme,
    theme,
    themedStyles: getThemedStyles(),
  };
};

/**
 * Higher-order component for wrapping components with theme support
 * @param {React.Component} Component - Component to wrap
 * @param {Object} options - Configuration options
 * @returns {React.Component} Themed component
 */
export const withTheme = (Component, options = {}) => {
  const { 
    className = '', 
    applyBackground = true,
    containerProps = {} 
  } = options;

  return function ThemedComponent(props) {
    const { elementRef, applyTheme } = useThemedComponent(true);

    const containerClassName = `themed-container ${className}`.trim();
    
    return (
      <div 
        ref={elementRef}
        className={containerClassName}
        {...containerProps}
      >
        <Component {...props} />
      </div>
    );
  };
};

/**
 * Hook for creating themed inline styles
 * @returns {Object} Themed style functions
 */
export const useThemedStyles = () => {
  const { theme } = useTheme();

  const createStyles = {
    // Card styles
    card: (customStyles = {}) => ({
      backgroundColor: theme.surface,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: '0.5rem',
      padding: '1rem',
      ...customStyles,
    }),

    // Button styles
    primaryButton: (customStyles = {}) => ({
      backgroundColor: theme.primary,
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      ...customStyles,
    }),

    secondaryButton: (customStyles = {}) => ({
      backgroundColor: 'transparent',
      color: theme.primary,
      border: `1px solid ${theme.primary}`,
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      ...customStyles,
    }),

    // Input styles
    input: (customStyles = {}) => ({
      backgroundColor: theme.surface,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: '0.375rem',
      padding: '0.5rem 0.75rem',
      width: '100%',
      ...customStyles,
    }),

    // Container styles
    container: (customStyles = {}) => ({
      backgroundColor: theme.background,
      color: theme.text,
      ...customStyles,
    }),

    // Surface styles
    surface: (customStyles = {}) => ({
      backgroundColor: theme.surface,
      color: theme.text,
      ...customStyles,
    }),
  };

  return {
    createStyles,
    theme,
  };
};

/**
 * React component for creating themed containers declaratively
 * @param {Object} props - Component props
 * @returns {React.Component} Themed container
 */
export const ThemedContainer = ({ 
  children, 
  className = '', 
  style = {},
  as: Component = 'div',
  ...props 
}) => {
  const { elementRef } = useThemedComponent(true);
  
  const containerClassName = `themed-container ${className}`.trim();
  
  return (
    <Component 
      ref={elementRef}
      className={containerClassName}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
};

export default useThemedComponent;