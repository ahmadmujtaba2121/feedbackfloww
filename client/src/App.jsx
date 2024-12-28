import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AIProvider } from './contexts/AIContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ProjectView = React.lazy(() => import('./pages/ProjectView'));
const CanvasPage = React.lazy(() => import('./pages/CanvasPage'));
const KanbanPage = React.lazy(() => import('./pages/KanbanPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));
const SignIn = React.lazy(() => import('./pages/SignIn'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const PricingPage = React.lazy(() => import('./pages/PricingPage'));
const AIPage = React.lazy(() => import('./pages/AIPage'));
const InvitePage = React.lazy(() => import('./pages/InvitePage'));
const AIAssistant = React.lazy(() => import('./pages/AIAssistant'));
const UserGuidePage = React.lazy(() => import('./pages/UserGuidePage'));
const JoinProject = React.lazy(() => import('./pages/JoinProject'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner />
      <p className="text-white mt-4">Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <Suspense fallback={<LoadingFallback />}>
          <AuthProvider>
            <NotificationProvider>
              <AIProvider>
                <AppContent />
              </AIProvider>
            </NotificationProvider>
          </AuthProvider>
        </Suspense>
      </ThemeProvider>
    </HelmetProvider>
  );
};

const AppContent = () => {
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();
  const [appReady, setAppReady] = useState(false);
  const isCanvasPage = location.pathname.includes('/canvas');
  const isInvitePath = location.pathname.includes('/invite/');

  useEffect(() => {
    // Set app as ready after a short delay if auth is still loading
    const timeout = setTimeout(() => {
      if (authLoading) {
        setAppReady(true);
      }
    }, 2000);

    // If auth finishes loading, set app as ready immediately
    if (!authLoading) {
      setAppReady(true);
    }

    return () => clearTimeout(timeout);
  }, [authLoading]);

  if (!appReady) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-[#080C14]">
      <Toaster position="top-right" />
      {!isCanvasPage && !isInvitePath && <Navigation />}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/join" element={<JoinProject />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/ai" element={<PrivateRoute><AIPage /></PrivateRoute>} />
          <Route path="/.ai" element={<Navigate to="/ai" replace />} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

          {/* Project routes */}
          <Route path="/project/:projectId" element={<PrivateRoute><ProjectView /></PrivateRoute>} />
          <Route path="/project/:projectId/canvas" element={<PrivateRoute><CanvasPage /></PrivateRoute>} />
          <Route path="/project/:projectId/kanban" element={<PrivateRoute><KanbanPage /></PrivateRoute>} />
          <Route path="/project/:projectId/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
          <Route path="/project/:projectId/ai-assistant" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />

          {/* User guide route */}
          <Route path="/guide" element={<PrivateRoute><UserGuidePage /></PrivateRoute>} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;
