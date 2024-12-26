import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CommentProvider } from "./contexts/CommentContext";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import ProjectView from "./pages/ProjectView";
import CanvasPage from "./pages/CanvasPage";
import CollaborativeCanvasPage from "./pages/CollaborativeCanvasPage";
import SettingsPage from "./pages/SettingsPage";
import InvitePage from "./pages/InvitePage";

function AppContent() {
  return (
    <Routes>
      {/* Public Home Page */}
      <Route path="/" element={<HomePage />} />

      {/* Dashboard Route */}
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />

      {/* Project View Route */}
      <Route path="/project/:projectId" element={
        <PrivateRoute>
          <ProjectView />
        </PrivateRoute>
      } />

      {/* Canvas Route */}
      <Route path="/project/:projectId/canvas" element={
        <PrivateRoute>
          <CanvasPage />
        </PrivateRoute>
      } />

      {/* Invite Routes */}
      <Route path="/invite/:projectId/:inviteId" element={
        <PrivateRoute>
          <ProjectView />
        </PrivateRoute>
      } />

      <Route path="/invite/:projectId/:inviteId/canvas" element={
        <PrivateRoute>
          <CanvasPage isInviteLink={true} />
        </PrivateRoute>
      } />

      {/* Collaborative Canvas Route */}
      <Route path="/collaborative/:projectId" element={
        <PrivateRoute>
          <CollaborativeCanvasPage />
        </PrivateRoute>
      } />

      {/* Settings Route */}
      <Route path="/settings" element={
        <PrivateRoute>
          <SettingsPage />
        </PrivateRoute>
      } />

      {/* Invite Page Route */}
      <Route path="/invite/:inviteId" element={
        <PrivateRoute>
          <InvitePage />
        </PrivateRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CommentProvider>
            <AppContent />
          </CommentProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;