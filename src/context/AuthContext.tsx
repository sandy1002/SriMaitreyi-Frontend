import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Patient, UserRole, StaffRole } from '@/types';
import { fetchPatients, loginApi } from '@/services/api';

const AUTH_STORAGE_KEY = 'srimai_auth';

const DEMO_PATIENTS: Patient[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Anita Sharma',
    age: 52,
    gender: 'Female',
    medicalRecordNumber: 'MRN-DEMO-001',
    dialysisStartDate: '2023-01-01',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Ravi Kumar',
    age: 47,
    gender: 'Male',
    medicalRecordNumber: 'MRN-DEMO-002',
    dialysisStartDate: '2022-08-15',
  },
];

interface StoredAuth {
  user: User;
  patient: Patient | null;
}

function normalizePatient(raw: Record<string, unknown> | null | undefined): Patient | null {
  if (!raw) return null;
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    age: (raw.age as number | string) ?? '',
    gender: (raw.gender as Patient['gender']) ?? 'Other',
    medicalRecordNumber: String(
      raw.medicalRecordNumber ?? raw.medical_record_number ?? `MRN-${String(raw.id).slice(0, 8)}`
    ),
    dialysisStartDate: String(
      raw.dialysisStartDate ?? raw.dialysis_since ?? raw.dialysisSince ?? ''
    ),
    dialysisSince: String(raw.dialysisSince ?? raw.dialysis_since ?? ''),
    createdAt: raw.createdAt as string | undefined,
  };
}

const STAFF_ROLES: StaffRole[] = ['technician', 'doctor', 'nutrition'];

function normalizeUser(raw: Record<string, unknown>): User {
  const rawRole = String(raw.role ?? 'patient');
  let role: UserRole = 'patient';
  if (rawRole === 'admin' || rawRole === 'clinician') role = 'admin';
  else if (STAFF_ROLES.includes(rawRole as StaffRole)) role = rawRole as StaffRole;
  else if (rawRole === 'patient') role = 'patient';
  return {
    id: String(raw.id),
    role,
    patientId: raw.patientId ? String(raw.patientId) : raw.patient_id ? String(raw.patient_id) : undefined,
    name: String(raw.name ?? ''),
  };
}

interface AuthContextType {
  user: User | null;
  patient: Patient | null;
  patients: Patient[];
  patientsError: string | null;
  loginAsPatient: (patientId: string) => Promise<void>;
  loginAsAdmin: (username: string, password: string) => Promise<void>;
  loginAsStaff: (role: StaffRole, username: string, password: string) => Promise<void>;
  refreshPatients: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPatient: boolean;
  isStaff: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as StoredAuth;
        setUser(normalizeUser(stored.user as unknown as Record<string, unknown>));
        setPatient(
          stored.patient
            ? normalizePatient(stored.patient as unknown as Record<string, unknown>)
            : null
        );
      }
    } catch (e) {
      console.error('Failed to restore auth session', e);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPatients = async () => {
    try {
      const patientList = await fetchPatients();
      setPatients(patientList);
      setPatientsError(null);
    } catch (error) {
      console.error('Failed to fetch patients', error);
      setPatients(DEMO_PATIENTS);
      setPatientsError(null);
    }
  };

  useEffect(() => {
    refreshPatients();
  }, []);

  const persistAuth = (nextUser: User, nextPatient: Patient | null) => {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user: nextUser, patient: nextPatient })
    );
  };

  const applyLoginResponse = (response: { user: Record<string, unknown>; patient?: Record<string, unknown> | null }) => {
    const nextUser = normalizeUser(response.user);
    const nextPatient = normalizePatient(response.patient ?? null);
    setUser(nextUser);
    setPatient(nextPatient);
    persistAuth(nextUser, nextPatient);
  };

  const loginAsPatient = async (patientId: string) => {
    try {
      const response = await loginApi('patient', { patientId });
      applyLoginResponse(response);
    } catch (error) {
      console.error('Login API unavailable, using local fallback', error);
      const selected = patients.find((p) => p.id === patientId) ?? null;
      if (!selected) throw new Error('Patient not found');
      const nextUser: User = {
        id: `local-user-${patientId}`,
        role: 'patient',
        patientId,
        name: selected.name,
      };
      setUser(nextUser);
      setPatient(selected);
      persistAuth(nextUser, selected);
    }
  };

  const loginAsAdmin = async (username: string, password: string) => {
    const response = await loginApi('admin', { username, password });
    applyLoginResponse(response);
  };

  const loginAsStaff = async (role: StaffRole, username: string, password: string) => {
    const response = await loginApi(role, { username, password });
    applyLoginResponse(response);
  };

  const logout = () => {
    setUser(null);
    setPatient(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const isAdmin = user?.role === 'admin';
  const isPatient = user?.role === 'patient';
  const isStaff =
    user?.role === 'technician' || user?.role === 'doctor' || user?.role === 'nutrition';

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        patients,
        patientsError,
        loginAsPatient,
        loginAsAdmin,
        loginAsStaff,
        refreshPatients,
        logout,
        isAuthenticated: !!user,
        isAdmin,
        isPatient,
        isStaff,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

/** Where to send the user after login or when already authenticated */
export function getHomePath(role: UserRole | undefined): string {
  if (role === 'admin') return '/admin';
  if (role === 'technician' || role === 'doctor' || role === 'nutrition') return '/staff';
  return '/dashboard';
}
