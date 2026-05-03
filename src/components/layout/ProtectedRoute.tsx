import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user && !user.isProfileComplete) {
    const dest = user.role === 'BRAND' ? '/complete-profile/brand' : '/complete-profile/user';
    return <Navigate to={dest} replace />;
  }

  return <Outlet />;
}
