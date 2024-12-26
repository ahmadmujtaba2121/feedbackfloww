import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AIProvider } from './contexts/AIContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import CanvasPage from './pages/CanvasPage';
import KanbanPage from './pages/KanbanPage';
import CalendarPage from './pages/CalendarPage';
import SignIn from './pages/SignIn';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/PricingPage';
import AIPage from './pages/AIPage';
import InvitePage from './pages/InvitePage';
import AIAssistant from './pages/AIAssistant';
import UserGuidePage from './pages/UserGuidePage';

const App = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <NotificationProvider>
              <AIProvider>
                <AppContent />
              </AIProvider>
            </NotificationProvider>
          </SubscriptionProvider>
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
        <Route path="/invite/:projectId/:inviteId" element={<PrivateRoute><InvitePage /></PrivateRoute>} />
        <Route path="/invite/:projectId/:inviteId/canvas" element={<PrivateRoute><CanvasPage isInviteLink={true} /></PrivateRoute>} />
        <Route path="/invite/:projectId/:inviteId/kanban" element={<PrivateRoute><KanbanPage isInviteLink={true} /></PrivateRoute>} />
        <Route path="/invite/:projectId/:inviteId/calendar" element={<PrivateRoute><CalendarPage isInviteLink={true} /></PrivateRoute>} />

        {/* User guide route */}
        <Route path="/guide" element={<PrivateRoute><UserGuidePage /></PrivateRoute>} />

        {/* Catch all route */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
  );
};

export default App;
