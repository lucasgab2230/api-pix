import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { PixKeys } from './pages/PixKeys';
import { SendPix } from './pages/SendPix';
import { Transactions } from './pages/Transactions';

import { NewPixAutomatic } from './pages/NewPixAutomatic';
import { BankSettings } from './pages/BankSettings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <RealtimeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pix-keys"
            element={
              <ProtectedRoute>
                <PixKeys />
              </ProtectedRoute>
            }
          />
          <Route
            path="/send-pix"
            element={
              <ProtectedRoute>
                <SendPix />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pix-automatic/new"
            element={
              <ProtectedRoute>
                <NewPixAutomatic />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bank-settings"
            element={
              <ProtectedRoute>
                <BankSettings onBack={() => window.location.href = '/dashboard'} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </RealtimeProvider>
  );
}
