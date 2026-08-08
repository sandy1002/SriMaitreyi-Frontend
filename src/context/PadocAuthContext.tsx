import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { padocLogin } from '@/services/padocApi';

const PADOC_AUTH_KEY = 'padoc_auth';

export type PadocDoctor = {
  id: string;
  username: string;
  displayName: string;
  role: 'padoc_doctor';
};

type PadocAuthContextType = {
  doctor: PadocDoctor | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const PadocAuthContext = createContext<PadocAuthContextType | undefined>(undefined);

function normalizeDoctor(raw: Record<string, unknown>): PadocDoctor {
  return {
    id: String(raw.id),
    username: String(raw.username ?? ''),
    displayName: String(raw.display_name ?? raw.displayName ?? raw.username ?? 'Doctor'),
    role: 'padoc_doctor',
  };
}

export function PadocAuthProvider({ children }: { children: ReactNode }) {
  const [doctor, setDoctor] = useState<PadocDoctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PADOC_AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { doctor?: Record<string, unknown> };
        if (parsed.doctor) setDoctor(normalizeDoctor(parsed.doctor));
      }
    } catch {
      sessionStorage.removeItem(PADOC_AUTH_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await padocLogin(username, password);
    const next = normalizeDoctor(data.doctor as Record<string, unknown>);
    setDoctor(next);
    sessionStorage.setItem(
      PADOC_AUTH_KEY,
      JSON.stringify({
        doctor: {
          id: next.id,
          username: next.username,
          display_name: next.displayName,
          role: next.role,
        },
      })
    );
  };

  const logout = () => {
    setDoctor(null);
    sessionStorage.removeItem(PADOC_AUTH_KEY);
  };

  return (
    <PadocAuthContext.Provider
      value={{
        doctor,
        isAuthenticated: !!doctor,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </PadocAuthContext.Provider>
  );
}

export function usePadocAuth() {
  const ctx = useContext(PadocAuthContext);
  if (!ctx) throw new Error('usePadocAuth must be used within PadocAuthProvider');
  return ctx;
}
