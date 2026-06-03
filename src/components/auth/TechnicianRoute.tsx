import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/** Routes reserved for dialysis technicians (session start, etc.). */
export function TechnicianRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'technician') {
    return <Navigate to="/staff" replace />;
  }

  return <>{children}</>;
}
