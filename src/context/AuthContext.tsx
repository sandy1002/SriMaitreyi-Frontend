import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Patient, UserRole, StaffRole } from '@/types';
import { fetchPatients, loginApi, setAuthToken } from '@/services/api';

const AUTH_STORAGE_KEY = 'srimai_auth';

interface StoredAuth {
  user: User;
  patient: Patient | null;
  token?: string;
}

function normalizePatient(raw: Record<string, unknown> | null | undefined): Patient | null {
  if (!raw) return null;
  return {
    id: String(raw.id),
    name: String(raw.name ?? ''),
    age: (raw.age as number | string) ?? '',
    gender: (raw.gender as Patient['gender']) ?? 'Other',
    email: raw.email ? String(raw.email) : undefined,
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
  const mustChange =
    raw.mustChangePassword === true ||
    raw.must_change_password === true;
  return {
    id: String(raw.id),
    role,
    patientId: raw.patientId ? String(raw.patientId) : raw.patient_id ? String(raw.patient_id) : undefined,
    name: String(raw.name ?? ''),
    username: raw.username ? String(raw.username) : undefined,
    mustChangePassword: role === 'patient' ? mustChange : false,
  };
}

interface AuthContextType {
  user: User | null;
  patient: Patient | null;
  patients: Patient[];
  patientsError: string | null;
  loginAsPatient: (username: string, password: string) => Promise<{ mustChangePassword: boolean }>;
  loginAsAdmin: (username: string, password: string) => Promise<void>;
  loginAsStaff: (role: StaffRole, username: string, password: string) => Promise<void>;
  applyPasswordChange: (response: {
    user?: Record<string, unknown>;
    patient?: Record<string, unknown> | null;
    token?: string;
    mustChangePassword?: boolean;
  }) => void;
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
        if (stored.token) setAuthToken(stored.token);
      }
    } catch (e) {
      console.error('Failed to restore auth session', e);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPatients = async () => {
    // Only staff/admin should load the full patient directory.
    if (user?.role === 'patient') {
      setPatients(patient ? [patient] : []);
      setPatientsError(null);
      return;
    }
    if (!user || (user.role !== 'admin' && !STAFF_ROLES.includes(user.role as StaffRole))) {
      setPatients([]);
      setPatientsError(null);
      return;
    }
    try {
      const patientList = await fetchPatients();
      setPatients(patientList);
      setPatientsError(null);
    } catch (error) {
      console.error('Failed to fetch patients', error);
      setPatients([]);
      setPatientsError('Failed to load patients');
    }
  };

  useEffect(() => {
    if (isLoading) return;
    void refreshPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when role/session changes
  }, [isLoading, user?.role, user?.id, patient?.id]);

  const persistAuth = (nextUser: User, nextPatient: Patient | null, token?: string | null) => {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user: nextUser, patient: nextPatient, token: token || undefined })
    );
  };

  const applyLoginResponse = (response: {
    user: Record<string, unknown>;
    patient?: Record<string, unknown> | null;
    token?: string;
    mustChangePassword?: boolean;
  }) => {
    const userRaw = {
      ...response.user,
      mustChangePassword:
        response.mustChangePassword ??
        response.user.mustChangePassword ??
        response.user.must_change_password,
    };
    const nextUser = normalizeUser(userRaw);
    const nextPatient = normalizePatient(response.patient ?? null);
    const token = response.token ? String(response.token) : null;
    setAuthToken(token);
    setUser(nextUser);
    setPatient(nextPatient);
    persistAuth(nextUser, nextPatient, token);
    return nextUser;
  };

  const loginAsPatient = async (username: string, password: string) => {
    const response = await loginApi('patient', { username, password });
    const nextUser = applyLoginResponse(response);
    return { mustChangePassword: !!nextUser.mustChangePassword };
  };

  const loginAsAdmin = async (username: string, password: string) => {
    const response = await loginApi('admin', { username, password });
    applyLoginResponse(response);
  };

  const loginAsStaff = async (role: StaffRole, username: string, password: string) => {
    const response = await loginApi(role, { username, password });
    applyLoginResponse(response);
  };

  const applyPasswordChange = (response: {
    user?: Record<string, unknown>;
    patient?: Record<string, unknown> | null;
    token?: string;
    mustChangePassword?: boolean;
  }) => {
    if (response.user) {
      applyLoginResponse({
        user: { ...response.user, mustChangePassword: false },
        patient: response.patient,
        token: response.token,
        mustChangePassword: false,
      });
      return;
    }
    if (user) {
      const nextUser = { ...user, mustChangePassword: false };
      setUser(nextUser);
      persistAuth(nextUser, patient, undefined);
    }
  };

  const logout = () => {
    setUser(null);
    setPatient(null);
    setPatients([]);
    setAuthToken(null);
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
        applyPasswordChange,
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
