import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Patient } from '@/types';
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
  patient: Patient;
}

function normalizePatient(raw: Record<string, unknown>): Patient {
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
  };
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id),
    role: raw.role as User['role'],
    patientId: raw.patientId ? String(raw.patientId) : raw.patient_id ? String(raw.patient_id) : undefined,
    name: String(raw.name ?? ''),
  };
}

interface AuthContextType {
  user: User | null;
  patient: Patient | null;
  patients: Patient[];
  patientsError: string | null;
  login: (patientId: string, role: 'patient' | 'clinician') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
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
        setPatient(normalizePatient(stored.patient as unknown as Record<string, unknown>));
      }
    } catch (e) {
      console.error('Failed to restore auth session', e);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
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

    loadPatients();
  }, []);

  const persistAuth = (nextUser: User, nextPatient: Patient | null) => {
    if (nextPatient) {
      sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user: nextUser, patient: nextPatient })
      );
    }
  };

  const login = async (patientId: string, role: 'patient' | 'clinician') => {
    try {
      const response = await loginApi(patientId, role);
      const nextUser = normalizeUser(response.user);
      const nextPatient = normalizePatient(response.patient);
      setUser(nextUser);
      setPatient(nextPatient);
      persistAuth(nextUser, nextPatient);
    } catch (error) {
      console.error('Login API unavailable, using local fallback user', error);
      const selected = patients.find((p) => p.id === patientId) ?? null;
      const nextUser: User = {
        id: `local-user-${patientId}`,
        role,
        patientId,
        name: role === 'patient' ? selected?.name ?? 'Patient' : 'Clinician',
      };
      setUser(nextUser);
      setPatient(selected);
      if (selected) persistAuth(nextUser, selected);
    }
  };

  const logout = () => {
    setUser(null);
    setPatient(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        patients,
        patientsError,
        login,
        logout,
        isAuthenticated: !!user,
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
