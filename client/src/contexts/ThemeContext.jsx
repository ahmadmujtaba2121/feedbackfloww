import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [customColors, setCustomColors] = useState({});

  const applyTheme = (themeName, colors = null) => {
    document.documentElement.setAttribute('data-theme', themeName);
    if (colors) {
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    }
  };

  useEffect(() => {
    // Load theme and custom colors from localStorage
    const savedTheme = localStorage.getItem('theme') || 'default';
    const savedCustomColors = JSON.parse(localStorage.getItem('customColors') || '{}');
    setCurrentTheme(savedTheme);
    setCustomColors(savedCustomColors);
    applyTheme(savedTheme, savedCustomColors[savedTheme]);
  }, []);

  const changeTheme = (newTheme) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme, customColors[newTheme]);
  };

  const setCustomThemeColors = (themeName, colors) => {
    const newCustomColors = {
      ...customColors,
      [themeName]: colors,
    };
    setCustomColors(newCustomColors);
    localStorage.setItem('customColors', JSON.stringify(newCustomColors));
    if (currentTheme === themeName) {
      applyTheme(themeName, colors);
    }
  };

  const themePresets = {
    monochrome: {
      dark: {
        name: 'Dark Monochrome',
        colors: {
          background: '#18181b',
          foreground: '#27272a',
          primary: '#e4e4e7',
          secondary: '#3f3f46',
          accent: '#d4d4d8',
          muted: '#3f3f46',
          border: '#3f3f46',
          'primary-foreground': '#18181b',
          'secondary-foreground': '#fafafa',
          'muted-foreground': '#a1a1aa',
        },
      },
      light: {
        name: 'Light Monochrome',
        colors: {
          background: '#fafafa',
          foreground: '#f4f4f5',
          primary: '#27272a',
          secondary: '#e4e4e7',
          accent: '#52525b',
          muted: '#e4e4e7',
          border: '#e4e4e7',
          'primary-foreground': '#fafafa',
          'secondary-foreground': '#18181b',
          'muted-foreground': '#71717a',
        },
      },
      contrast: {
        name: 'High Contrast',
        colors: {
          background: '#000000',
          foreground: '#121212',
          primary: '#ffffff',
          secondary: '#1f1f1f',
          accent: '#e5e5e5',
          muted: '#1f1f1f',
          border: '#1f1f1f',
          'primary-foreground': '#000000',
          'secondary-foreground': '#ffffff',
          'muted-foreground': '#a3a3a3',
        },
      },
    },
    ocean: {
      deep: {
        name: 'Deep Ocean',
        colors: {
          background: '#042f49',
          foreground: '#0c4a6e',
          primary: '#38bdf8',
          secondary: '#164e63',
          accent: '#0ea5e9',
          muted: '#164e63',
          border: '#164e63',
          'primary-foreground': '#042f49',
          'secondary-foreground': '#e0f2fe',
          'muted-foreground': '#7dd3fc',
        },
      },
      arctic: {
        name: 'Arctic Ocean',
        colors: {
          background: '#083344',
          foreground: '#155e75',
          primary: '#22d3ee',
          secondary: '#164e63',
          accent: '#06b6d4',
          muted: '#164e63',
          border: '#164e63',
          'primary-foreground': '#083344',
          'secondary-foreground': '#ecfeff',
          'muted-foreground': '#67e8f9',
        },
      },
      tropical: {
        name: 'Tropical Ocean',
        colors: {
          background: '#0c4a6e',
          foreground: '#075985',
          primary: '#7dd3fc',
          secondary: '#0369a1',
          accent: '#38bdf8',
          muted: '#0369a1',
          border: '#0369a1',
          'primary-foreground': '#0c4a6e',
          'secondary-foreground': '#f0f9ff',
          'muted-foreground': '#bae6fd',
        },
      },
    },
    'sunset-warm': {
      golden: {
        name: 'Golden Sunset',
        colors: {
          background: '#1f1410',
          foreground: '#4b2c1b',
          primary: '#f59e0b',
          secondary: '#713f12',
          accent: '#fb923c',
          muted: '#713f12',
          border: '#713f12',
          'primary-foreground': '#1f1410',
          'secondary-foreground': '#fef3c7',
          'muted-foreground': '#fcd34d',
        },
      },
      rose: {
        name: 'Rose Sunset',
        colors: {
          background: '#4c1d95',
          foreground: '#5b21b6',
          primary: '#e879f9',
          secondary: '#7e22ce',
          accent: '#d946ef',
          muted: '#7e22ce',
          border: '#7e22ce',
          'primary-foreground': '#4c1d95',
          'secondary-foreground': '#fae8ff',
          'muted-foreground': '#f0abfc',
        },
      },
      desert: {
        name: 'Desert Sunset',
        colors: {
          background: '#451a03',
          foreground: '#7c2d12',
          primary: '#fdba74',
          secondary: '#9a3412',
          accent: '#fb923c',
          muted: '#9a3412',
          border: '#9a3412',
          'primary-foreground': '#451a03',
          'secondary-foreground': '#ffedd5',
          'muted-foreground': '#fed7aa',
        },
      },
    },
  };

  const themes = {
    default: {
      name: 'Default',
      colors: {
        background: '#080C14',
        foreground: '#0A1628',
        primary: '#2DD4BF',
        secondary: '#1B2B44',
        accent: '#14B8A6',
        muted: '#1B2B44',
        border: '#1B2B44',
        'primary-foreground': '#080C14',
        'secondary-foreground': '#E5E9F0',
        'muted-foreground': '#94A3B8',
      },
    },
    emerald: {
      name: 'Emerald',
      colors: {
        background: '#0f1f1a',
        foreground: '#132d25',
        primary: '#10b981',
        secondary: '#1e4037',
        accent: '#059669',
        muted: '#1e4037',
        border: '#1e4037',
        'primary-foreground': '#0f1f1a',
        'secondary-foreground': '#e2f5ef',
        'muted-foreground': '#34d399',
      },
    },
    purple: {
      name: 'Purple',
      colors: {
        background: '#1E1B2E',
        foreground: '#2A2640',
        primary: '#B197FC',
        secondary: '#433D66',
        accent: '#9775FA',
        muted: '#433D66',
        border: '#433D66',
        'primary-foreground': '#1E1B2E',
        'secondary-foreground': '#F3F0FF',
        'muted-foreground': '#D0BFFF',
      },
    },
    ocean: {
      name: 'Ocean',
      colors: {
        background: '#042f49',
        foreground: '#0c4a6e',
        primary: '#38bdf8',
        secondary: '#164e63',
        accent: '#0ea5e9',
        muted: '#164e63',
        border: '#164e63',
        'primary-foreground': '#042f49',
        'secondary-foreground': '#e0f2fe',
        'muted-foreground': '#7dd3fc',
      },
    },
    sunset: {
      name: 'Sunset',
      colors: {
        background: '#18181B',
        foreground: '#27272A',
        primary: '#F97316',
        secondary: '#3F3F46',
        accent: '#F97316',
        muted: '#3F3F46',
        border: '#3F3F46',
        'primary-foreground': '#18181B',
        'secondary-foreground': '#FAFAFA',
        'muted-foreground': '#A1A1AA',
      },
    },
    'sunset-warm': {
      name: 'Sunset Warm',
      colors: {
        background: '#1f1410',
        foreground: '#4b2c1b',
        primary: '#f59e0b',
        secondary: '#713f12',
        accent: '#fb923c',
        muted: '#713f12',
        border: '#713f12',
        'primary-foreground': '#1f1410',
        'secondary-foreground': '#fef3c7',
        'muted-foreground': '#fcd34d',
      },
    },
    'monochrome': {
      name: 'Monochrome',
      colors: {
        background: '#18181b',
        foreground: '#27272a',
        primary: '#e4e4e7',
        secondary: '#3f3f46',
        accent: '#d4d4d8',
        muted: '#3f3f46',
        border: '#3f3f46',
        'primary-foreground': '#18181b',
        'secondary-foreground': '#fafafa',
        'muted-foreground': '#a1a1aa',
      },
    },
    light: {
      name: 'Light',
      colors: {
        background: '#f8fafc',
        foreground: '#f1f5f9',
        primary: '#64748b',
        secondary: '#e2e8f0',
        accent: '#475569',
        muted: '#e2e8f0',
        border: '#e2e8f0',
        'primary-foreground': '#f8fafc',
        'secondary-foreground': '#0f172a',
        'muted-foreground': '#64748b',
      },
    },
    'light-brown': {
      name: 'Light Brown',
      colors: {
        background: '#faf6f1',
        foreground: '#f5ebe0',
        primary: '#8b5e34',
        secondary: '#ddb892',
        accent: '#6f4518',
        muted: '#e6ccb2',
        border: '#ddb892',
        'primary-foreground': '#faf6f1',
        'secondary-foreground': '#3f2305',
        'muted-foreground': '#b08968',
      },
    },
    'classic': {
      name: 'Classic Light',
      colors: {
        background: '#ffffff',
        foreground: '#f8f9fa',
        primary: '#000000',
        secondary: '#e9ecef',
        accent: '#343a40',
        muted: '#dee2e6',
        border: '#dee2e6',
        'primary-foreground': '#ffffff',
        'secondary-foreground': '#212529',
        'muted-foreground': '#6c757d',
      },
    },
    'soft-sky': {
      name: 'Soft Sky',
      colors: {
        background: '#f8faff',
        foreground: '#f1f5ff',
        primary: '#4b6bfb',
        secondary: '#e5eaff',
        accent: '#3451e0',
        muted: '#edf0ff',
        border: '#e5eaff',
        'primary-foreground': '#ffffff',
        'secondary-foreground': '#1e293b',
        'muted-foreground': '#6b7cb4',
      },
    },
  };

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      changeTheme,
      themes,
      themePresets,
      customColors,
      setCustomThemeColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
