import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Blocks logged-in patients from opening another patient's URL
 * (e.g. /nutrition-diary/:patientId of a different account).
 */
export function PatientScopeRoute({ children }: { children: React.ReactNode }) {
  const { patientId } = useParams<{ patientId?: string }>();
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

  if (isPatient && patientId && patient?.id && patientId !== patient.id) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
