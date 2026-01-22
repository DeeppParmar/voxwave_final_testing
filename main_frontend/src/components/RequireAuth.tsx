import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-void-deep" />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
