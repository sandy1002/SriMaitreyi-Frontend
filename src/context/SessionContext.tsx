import React, { createContext, useContext, useState } from 'react';
import * as api from '@/services/api';
import {
  ClinicalAlert,
  ClinicalCheck,
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
      potassiumMmolL?: number;
      targetDryWeightKg?: number;
      primeRinsebackMl?: number;
      ivFluidsMl?: number;
      oralIntakeMl?: number;
      previousSessionPostK?: number;
      technicianName?: string;
      nurseName?: string;
      doctorName?: string;
    }
  ) => Promise<{ session: DialysisSession; alerts: ClinicalAlert[]; checks: ClinicalCheck[] }>;

  addNote: (
    sessionId: string,
    noteText: string
  ) => Promise<{ alerts: ClinicalAlert[]; checks: ClinicalCheck[] }>;

  closeSession: (
    sessionId: string,
    payload?: {
      postWeightKg?: number;
      postBp?: string;
      totalUfRemoved?: number;
      condition?: 'Stable' | 'Unstable';
      technicianName?: string;
      nurseName?: string;
      doctorName?: string;
      postPotassiumMmolL?: number;
    }
  ) => Promise<{ session: DialysisSession; alerts: ClinicalAlert[]; checks: ClinicalCheck[] }>;

  medicationIntakes: import('@/types').SessionMedicationIntake[];
  notes: SessionNote[];
  attachments: SessionAttachment[];
  alerts: ClinicalAlert[];
  checks: ClinicalCheck[];
  vitalReadings: import('@/types').SessionVitalReading[];
  vitalsWorkflow: import('@/types').VitalsWorkflowState | null;
  medicationIntakes: import('@/types').SessionMedicationIntake[];
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<DialysisSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DialysisSession | null>(null);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [attachments, setAttachments] = useState<SessionAttachment[]>([]);
  const [alerts, setAlerts] = useState<ClinicalAlert[]>([]);
  const [checks, setChecks] = useState<ClinicalCheck[]>([]);
  const [vitalReadings, setVitalReadings] = useState<import('@/types').SessionVitalReading[]>([]);
  const [vitalsWorkflow, setVitalsWorkflow] = useState<import('@/types').VitalsWorkflowState | null>(null);
  const [medicationIntakes, setMedicationIntakes] = useState<import('@/types').SessionMedicationIntake[]>([]);

  const loadSessionsByPatient = async (patientId: string) => {
    const data = await api.getPatientSessions(patientId);
    setSessions(data);
  };

  const loadSessionDetails = async (sessionId: string) => {
    const data = await api.getSession(sessionId);
    setCurrentSession(data.session);
    setNotes(data.notes);
    setAttachments(data.attachments);
    setAlerts(data.alerts);
    setChecks([]);
    setVitalReadings(data.vitalReadings);
    setVitalsWorkflow(data.vitalsWorkflow);
    setMedicationIntakes(data.medicationIntakes);
  };

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
      potassiumMmolL?: number;
      targetDryWeightKg?: number;
      primeRinsebackMl?: number;
      ivFluidsMl?: number;
      oralIntakeMl?: number;
      previousSessionPostK?: number;
      technicianName?: string;
      nurseName?: string;
      doctorName?: string;
    }
  ) => {
    const result = await api.createSession({
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
      potassium_mmol_l: assessment.potassiumMmolL,
      target_dry_weight_kg: assessment.targetDryWeightKg,
      prime_rinseback_ml: assessment.primeRinsebackMl,
      iv_fluids_ml: assessment.ivFluidsMl,
      oral_intake_ml: assessment.oralIntakeMl,
      previous_session_post_k: assessment.previousSessionPostK,
      technician_name: assessment.technicianName,
      nurse_name: assessment.nurseName,
      doctor_name: assessment.doctorName,
    });

    setSessions((prev) => [result.session, ...prev]);
    setCurrentSession(result.session);
    setNotes([]);
    setAttachments([]);
    setAlerts(result.alerts);
    setChecks(result.checks);
    setMedicationIntakes([]);

    return result;
  };

  const addNote = async (sessionId: string, noteText: string) => {
    const result = await api.addNote(sessionId, noteText);
    setNotes((prev) => [...prev, result.note]);
    setAlerts(result.alerts);
    setChecks(result.checks);
    return result;
  };

  const closeSession = async (
    sessionId: string,
    payload?: {
      postWeightKg?: number;
      postBp?: string;
      totalUfRemoved?: number;
      condition?: 'Stable' | 'Unstable';
      technicianName?: string;
      nurseName?: string;
      doctorName?: string;
      postPotassiumMmolL?: number;
      postBloodSugar?: number;
    }
  ) => {
    const body = payload
      ? {
          post_weight_kg: payload.postWeightKg,
          post_bp: payload.postBp,
          total_uf_removed: payload.totalUfRemoved,
          condition: payload.condition,
          technician_name: payload.technicianName,
          nurse_name: payload.nurseName,
          doctor_name: payload.doctorName,
          post_potassium_mmol_l: payload.postPotassiumMmolL,
          post_blood_sugar: payload.postBloodSugar,
        }
      : {};

    const result = await api.closeSession(sessionId, body);
    setCurrentSession(result.session);
    setAlerts(result.alerts);
    setChecks(result.checks);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? result.session : s))
    );
    return result;
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
        alerts,
        checks,
        vitalReadings,
        vitalsWorkflow,
        medicationIntakes,
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
