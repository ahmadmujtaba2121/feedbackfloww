// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Initialize error handlers
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Define default theme colors
const defaultThemes = {
  default: {
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
  emerald: {
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
  purple: {
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
  ocean: {
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
  sunset: {
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
  'sunset-warm': {
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
  monochrome: {
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
  light: {
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
  classic: {
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
  'soft-sky': {
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
  'light-brown': {
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
  }
};

// Function to apply theme colors
const applyThemeColors = (themeName) => {
  try {
    const savedCustomColors = localStorage.getItem('customColors');
    const colors = savedCustomColors ? JSON.parse(savedCustomColors) : {};
    const currentThemeColors = colors[themeName] || defaultThemes[themeName];

    if (currentThemeColors) {
      Object.entries(currentThemeColors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}`, value);
      });
    }
  } catch (error) {
    console.error('Error applying theme colors:', error);
    // Fallback to default theme colors
    const defaultColors = defaultThemes[themeName] || defaultThemes.default;
    Object.entries(defaultColors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  }
};

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'default';
document.documentElement.setAttribute('data-theme', savedTheme);
applyThemeColors(savedTheme);

// Listen for theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
      const newTheme = document.documentElement.getAttribute('data-theme');
      if (newTheme) {
        applyThemeColors(newTheme);
      }
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});

// Remove any stale service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister()
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <HelmetProvider>
          <AuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--foreground)',
                  color: 'var(--secondary-foreground)',
                }
              }}
            />
          </AuthProvider>
        </HelmetProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
