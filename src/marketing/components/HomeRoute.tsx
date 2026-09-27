import { Navigate } from 'react-router-dom';
import { useAuth, getHomePath } from '@/context/AuthContext';
import { HomePage } from '@/marketing/pages/HomePage';

/** Public landing: marketing home when logged out, app home when logged in. */
export function HomeRoute() {
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

  return <HomePage />;
}
