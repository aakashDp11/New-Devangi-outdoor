import { useTheme } from '../contexts/ThemeContext';

// Hook for getting themed styles
export const useThemedStyles = () => {
  const { theme } = useTheme();

  const styles = {
    // Common component styles
    card: {
      backgroundColor: theme.surface,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: '0.5rem'
    },
    
    button: {
      primary: {
        backgroundColor: theme.primary,
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
      },
      
      secondary: {
        backgroundColor: 'transparent',
        color: theme.primary,
        border: `1px solid ${theme.primary}`,
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
      },
      
      accent: {
        backgroundColor: theme.accent,
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
      }
    },
    
    input: {
      backgroundColor: theme.background,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: '0.375rem',
      padding: '0.5rem 0.75rem'
    },
    
    modal: {
      backgroundColor: theme.surface,
      border: `1px solid ${theme.border}`,
      color: theme.text,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    },
    
    navbar: {
      backgroundColor: theme.surface,
      borderBottom: `1px solid ${theme.border}`,
      color: theme.text
    },
    
    sidebar: {
      backgroundColor: theme.surface,
      borderRight: `1px solid ${theme.border}`,
      color: theme.text
    },
    
    text: {
      primary: { color: theme.text },
      secondary: { color: theme.textSecondary },
      accent: { color: theme.accent }
    }
  };

  return styles;
};

// Hook for getting theme-aware CSS classes (for Tailwind compatibility)
export const useThemedClasses = () => {
  return {
    card: 'themed-card',
    buttonPrimary: 'themed-button-primary',
    buttonSecondary: 'themed-button-secondary',
    input: 'themed-input',
    modal: 'themed-modal',
    navbar: 'themed-navbar',
    sidebar: 'themed-sidebar',
    bg: {
      primary: 'bg-theme-primary',
      secondary: 'bg-theme-secondary',
      background: 'bg-theme-background',
      surface: 'bg-theme-surface',
      accent: 'bg-theme-accent'
    },
    text: {
      primary: 'text-theme-primary',
      secondary: 'text-theme-secondary',
      default: 'text-theme-text',
      muted: 'text-theme-text-secondary',
      accent: 'text-theme-accent'
    },
    border: {
      primary: 'border-theme-primary',
      default: 'border-theme-border',
      accent: 'border-theme-accent'
    }
  };
};