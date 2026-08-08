import { Navigate } from 'react-router-dom';
import { usePadocAuth } from '@/context/PadocAuthContext';

export function PadocProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = usePadocAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/padoc/login" replace />;
  }

  return <>{children}</>;
}

export function PadocPublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = usePadocAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/padoc/dashboard" replace />;
  }

  return <>{children}</>;
}
