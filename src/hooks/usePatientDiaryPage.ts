import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Patient } from '@/types';

/**
 * Resolve which patient a diary page is for (logged-in patient or staff route param).
 */
export function usePatientDiaryPage() {
  const { patientId: routePatientId } = useParams<{ patientId?: string }>();
  const { patient, patients, user, isAuthenticated, isPatient, isStaff, isAdmin } = useAuth();

  const targetPatientId = routePatientId || patient?.id;

  const activePatient: Patient | null = useMemo(() => {
    if (isPatient && patient?.id === targetPatientId) return patient;
    if (targetPatientId) {
      return patients.find((p) => p.id === targetPatientId) ?? null;
    }
    return null;
  }, [isPatient, patient, targetPatientId, patients]);

  const backPath = isPatient ? '/dashboard' : isAdmin ? '/admin' : '/staff';

  const staffMissingRoute = isStaff && !routePatientId;
  const staffPatientNotFound = isStaff && !!routePatientId && !activePatient;
  const patientMismatch = isPatient && patient?.id !== targetPatientId;

  return {
    activePatient,
    targetPatientId,
    backPath,
    user,
    isStaff,
    isTechnician: user?.role === 'technician',
    isAuthenticated,
    staffMissingRoute,
    staffPatientNotFound,
    patientMismatch,
  };
}
