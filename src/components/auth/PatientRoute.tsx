import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function PatientRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPatient, isLoading, patient } = useAuth();

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

  if (!isPatient || !patient) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
