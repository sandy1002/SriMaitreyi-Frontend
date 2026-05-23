import React, { createContext, useContext, useState } from 'react';
import * as api from '@/services/api';
import {
  DialysisSession,
  SessionNote,
  SessionAttachment,
} from '@/types';

interface SessionContextType {
  sessions: DialysisSession[];
  loadSessionsByPatient: (patientId: string) => Promise<void>;

  currentSession: DialysisSession | null;
  loadSessionDetails: (sessionId: string) => Promise<void>;

  createSession: (
    patientId: string,
    hospitalName: string,
    sessionDate: string,
    assessment: {
      weightKg: number;
      bloodPressure: string;
      pulse: number;
      temperature: number;
      bloodSugar: number;
      accessCondition: 'Normal' | 'Abnormal';
      ufGoal: string;
    }
  ) => Promise<DialysisSession>;

  addNote: (sessionId: string, noteText: string) => Promise<void>;
  closeSession: (sessionId: string, payload?: {
    postWeightKg?: number;
    postBp?: string;
    totalUfRemoved?: number;
    condition?: 'Stable' | 'Unstable';
    technicianName?: string;
    nurseName?: string;
    doctorName?: string;
  }) => Promise<void>;

  notes: SessionNote[];
  attachments: SessionAttachment[];
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [currentSession, setCurrentSession] =
    useState<DialysisSession | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [attachments, setAttachments] =
    useState<SessionAttachment[]>([]);

  // -------------------------------
  // Load all sessions for a patient
  // -------------------------------
  const loadSessionsByPatient = async (patientId: string) => {
    const data = await api.getPatientSessions(patientId);
    setSessions(data);
  };

  // -------------------------------
  // Load a single session details
  // -------------------------------
  const loadSessionDetails = async (sessionId: string) => {
    const data = await api.getSession(sessionId);
    setCurrentSession(data.session);
    setNotes(data.notes);
    setAttachments(data.attachments);
  };

  // -------------------------------
  // Create new dialysis session
  // -------------------------------
  const createSession = async (
    patientId: string,
    hospitalName: string,
    sessionDate: string,
    assessment: {
      weightKg: number;
      bloodPressure: string;
      pulse: number;
      temperature: number;
      bloodSugar: number;
      accessCondition: 'Normal' | 'Abnormal';
      ufGoal: string;
    }
  ): Promise<DialysisSession> => {
    const session = await api.createSession({
      patient_id: patientId,
      hospital_name: hospitalName,
      session_date: sessionDate,
      weight_kg: assessment.weightKg,
      blood_pressure: assessment.bloodPressure,
      pulse: assessment.pulse,
      temperature: assessment.temperature,
      blood_sugar: assessment.bloodSugar,
      access_condition: assessment.accessCondition,
      uf_goal: assessment.ufGoal,
    });

    setSessions(prev => [...prev, session]);
    setCurrentSession(session);
    setNotes([]);
    setAttachments([]);

    return session;
  };

  // -------------------------------
  // Add session note
  // -------------------------------
  const addNote = async (sessionId: string, noteText: string) => {
    const note = await api.addNote(sessionId, noteText);
    setNotes(prev => [...prev, note]);
  };

  // -------------------------------
  // Close session
  // -------------------------------
  const closeSession = async (sessionId: string, payload?: {
    postWeightKg?: number;
    postBp?: string;
    totalUfRemoved?: number;
    condition?: 'Stable' | 'Unstable';
    technicianName?: string;
    nurseName?: string;
    doctorName?: string;
  }) => {
    // map to backend field names
    const body = payload
      ? {
          post_weight_kg: payload.postWeightKg,
          post_bp: payload.postBp,
          total_uf_removed: payload.totalUfRemoved,
          condition: payload.condition,
          technician_name: payload.technicianName,
          nurse_name: payload.nurseName,
          doctor_name: payload.doctorName,
        }
      : undefined;

    await api.closeSession(sessionId, body);

    setCurrentSession(prev =>
      prev ? { ...prev, status: 'completed' } : prev
    );

    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId ? { ...s, status: 'completed' } : s
      )
    );
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        loadSessionsByPatient,
        currentSession,
        loadSessionDetails,
        createSession,
        addNote,
        closeSession,
        notes,
        attachments,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
