import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ClaimRolePage from './pages/ClaimRolePage';
import EquipmentPage from './pages/EquipmentPage';
import RequirementsPage from './pages/RequirementsPage';
import TierProgressPage from './pages/TierProgressPage';
import MembersPage from './pages/MembersPage';
import DataManagementPage from './pages/DataManagementPage';
import CalendarPage from './pages/CalendarPage';
import ScheduleDetailPage from './pages/ScheduleDetailPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-purple-400 text-xl animate-pulse">加载中...</div>
    </div>
  );
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<Navigate to="/calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="schedules/:id" element={<ScheduleDetailPage />} />
          <Route path="claim" element={<ClaimRolePage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="requirements" element={<RequirementsPage />} />
          <Route path="tier" element={<TierProgressPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="data" element={<DataManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
