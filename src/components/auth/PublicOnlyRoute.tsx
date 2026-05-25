import { Navigate } from 'react-router-dom';
import { useAuth, getHomePath } from '@/context/AuthContext';

/** Login page: redirect to role home if already signed in (after session restore). */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return <>{children}</>;
}
