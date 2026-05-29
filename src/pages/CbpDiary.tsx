import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { CbpReportCapture } from '@/components/clinical/CbpReportCapture';
import { ArrowLeft, TestTube2 } from 'lucide-react';

export default function CbpDiary() {
  const { patientId: routePatientId } = useParams<{ patientId?: string }>();
  const { patient, user, isAuthenticated, isPatient, isStaff, isAdmin } = useAuth();
  const navigate = useNavigate();

  const targetPatientId = routePatientId || patient?.id;

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!targetPatientId) return <Navigate to="/login" replace />;
  if (isPatient && patient?.id !== targetPatientId) {
    return <Navigate to="/dashboard" replace />;
  }

  const backPath = isPatient ? '/dashboard' : isAdmin ? '/admin' : '/staff';
  const displayGender = isPatient ? String(patient?.gender ?? '') : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-4xl space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TestTube2 className="h-7 w-7 text-primary" />
            Complete blood picture (CBP)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Record full blood count, smear findings, and renal chemistry with reference-range checks.
          </p>
        </div>
        <CbpReportCapture
          patientId={targetPatientId}
          patientGender={displayGender}
          showCardHeader={false}
        />
      </main>
    </div>
  );
}
