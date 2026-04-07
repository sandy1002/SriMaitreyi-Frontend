import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Patient } from '@/types';
import { fetchPatients, loginApi } from '@/services/api';

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

interface AuthContextType {
  user: User | null;
  patient: Patient | null;
  patients: Patient[];
  patientsError: string | null;
  login: (patientId: string, role: 'patient' | 'clinician') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsError, setPatientsError] = useState<string | null>(null);

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

  const login = async (patientId: string, role: 'patient' | 'clinician') => {
    try {
      const response = await loginApi(patientId, role);
      setUser(response.user);
      setPatient(response.patient);
    } catch (error) {
      console.error('Login API unavailable, using local fallback user', error);
      const selected = patients.find((p) => p.id === patientId) ?? null;
      setUser({
        id: `local-user-${patientId}`,
        role,
        patientId,
        name: role === 'patient' ? selected?.name ?? 'Patient' : 'Clinician',
      });
      setPatient(selected);
    }
  };

  const logout = () => {
    setUser(null);
    setPatient(null);
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
