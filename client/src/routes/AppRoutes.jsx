import { Routes, Route } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute';
import Dashboard from '../pages/Dashboard';
import ProjectView from '../pages/ProjectView';
import SignIn from '../pages/SignIn';
import SignupPage from '../pages/SignupPage';
import HomePage from '../pages/HomePage';
import SettingsPage from '../pages/SettingsPage';
import PricingPage from '../pages/PricingPage';
import Canvas from '../components/Canvas/Canvas';
import KanbanBoard from '../components/KanbanBoard';
import Calendar from '../components/Calendar';
import AIAssistant from '../components/AIAssistant';

const AppRoutes = () => {
    const location = useLocation();
    const isInvitePath = location.pathname.includes('/invite/');

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="/ai" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />

            {/* Project routes */}
            <Route path="/project/:projectId" element={<PrivateRoute><ProjectView /></PrivateRoute>} />
            <Route path="/project/:projectId/canvas" element={<PrivateRoute><Canvas /></PrivateRoute>} />
            <Route path="/project/:projectId/kanban" element={<PrivateRoute><KanbanBoard /></PrivateRoute>} />
            <Route path="/project/:projectId/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
            <Route path="/project/:projectId/ai-assistant" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />

            {/* Invite routes */}
            <Route path="/invite/:projectId/:inviteId" element={<PrivateRoute><ProjectView /></PrivateRoute>} />
            <Route path="/invite/:projectId/:inviteId/canvas" element={<PrivateRoute><Canvas /></PrivateRoute>} />
            <Route path="/invite/:projectId/:inviteId/kanban" element={<PrivateRoute><KanbanBoard /></PrivateRoute>} />
            <Route path="/invite/:projectId/:inviteId/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
            <Route path="/invite/:projectId/:inviteId/ai-assistant" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />

            {/* Catch all route */}
            <Route path="*" element={<HomePage />} />
        </Routes>
    );
};

export default AppRoutes; 