import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
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

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AIProvider>
              <AppContent />
            </AIProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isCanvasPage = location.pathname.includes('/canvas');
  const isInvitePath = location.pathname.includes('/invite/');

  return (
    <div className="min-h-screen bg-[#080C14]">
      <Toaster position="top-right" />
      {!isCanvasPage && !isInvitePath && <Navigation />}
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/pricing" element={<PricingPage />} />

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

          {/* Invite routes */}
          <Route path="/invite/:projectId/:inviteId" element={<InvitePage />} />
          <Route path="/invite/:projectId/:inviteId/canvas" element={<PrivateRoute><CanvasPage isInviteLink={true} /></PrivateRoute>} />
          <Route path="/invite/:projectId/:inviteId/kanban" element={<PrivateRoute><KanbanPage isInviteLink={true} /></PrivateRoute>} />
          <Route path="/invite/:projectId/:inviteId/calendar" element={<PrivateRoute><CalendarPage isInviteLink={true} /></PrivateRoute>} />

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
