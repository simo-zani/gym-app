import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { TabLayout } from '@/components/layout/TabLayout';
import { LoginPage } from '@/pages/LoginPage';
import { PlansPage } from '@/pages/PlansPage';
import { PlanEditorPage } from '@/pages/PlanEditorPage';
import { ExercisesPage } from '@/pages/ExercisesPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ProfilePage } from '@/pages/ProfilePage';

function LoginRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<ProtectedRoute />}>
          {/* Tabbed pages share the bottom nav */}
          <Route element={<TabLayout />}>
            <Route path="/" element={<PlansPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          {/* Full-screen editor (no bottom nav) */}
          <Route path="/plans/:id" element={<PlanEditorPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
