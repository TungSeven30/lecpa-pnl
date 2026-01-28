import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import { Login } from './pages/Login';
import { AuthVerify } from './pages/AuthVerify';
import { Dashboard } from './pages/Dashboard';
import { ProjectForm } from './pages/ProjectForm';
import { Layout } from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Placeholder for project detail page (Phase 2+)
function ProjectDetail() {
  return (
    <Layout title="Project">
      <p>Project detail coming in Phase 2 (Upload & Parse)</p>
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/verify" element={<AuthVerify />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/projects/new" element={
        <ProtectedRoute>
          <ProjectForm />
        </ProtectedRoute>
      } />
      <Route path="/projects/:id/edit" element={
        <ProtectedRoute>
          <ProjectForm />
        </ProtectedRoute>
      } />
      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <ProjectDetail />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
