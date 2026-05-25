export interface Patient {
  id: string;
  name: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other' | string;
  medicalRecordNumber: string;
  dialysisStartDate?: string;
  dialysisSince?: string;
  createdAt?: string;
}

export interface PatientOverview extends Patient {
  sessionCount: number;
  noteCount: number;
  attachmentCount: number;
  alertCount: number;
  sessions: DialysisSession[];
}

export type UserRole = 'patient' | 'admin';

export interface PreDialysisAssessment {
  weightKg?: number | null;
  bloodPressure?: string;
  pulse?: number | null;
  temperature?: number | null;
  bloodSugar?: number | null;
  accessCondition?: string;
  ufGoal?: string;
  potassiumMmolL?: number | null;
}

export interface SessionVitalReading {
  id: string;
  sessionId: string;
  intervalMinutes: number;
  label?: string;
  bloodPressure?: string;
  pulse?: number | null;
  potassiumMmolL?: number | null;
  ufRemovedLiters?: number | null;
  notes?: string;
  recordedAt?: string;
}

export interface VitalsWorkflowSlot {
  intervalMinutes: number;
  label: string;
  status: 'recorded' | 'pending';
}

export interface VitalsWorkflowState {
  intervalMinutes: number;
  sessionStartedAt?: string;
  readings: SessionVitalReading[];
  slots: VitalsWorkflowSlot[];
  nextDue?: {
    intervalMinutes: number;
    label: string;
    dueAt?: string;
  } | null;
}

export interface PostDialysisAssessment {
  postWeightKg?: number | null;
  postBp?: string;
  totalUfRemoved?: number | null;
  condition?: string;
  technicianName?: string;
  nurseName?: string;
  doctorName?: string;
}

export interface ClinicalAlert {
  id: string;
  sessionId: string;
  patientId: string;
  severity: 'low' | 'medium' | 'high' | string;
  code: string;
  message: string;
  evidence?: Record<string, unknown>;
  createdAt?: string;
}

export interface ClinicalCheck {
  item: string;
  reason: string;
}

export interface DialysisSession {
  id: string;
  patientId: string;
  sessionDate: string;
  hospitalName: string;
  status: 'in-progress' | 'completed';
  createdAt: string;
  summary?: string;
  preDialysisAssessment?: PreDialysisAssessment;
  postDialysisAssessment?: PostDialysisAssessment;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  noteText: string;
  createdAt: string;
}

export interface SessionAttachment {
  id: string;
  sessionId: string;
  fileName: string;
  fileType: 'image' | 'pdf' | 'audio' | 'document' | string;
  fileUrl: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  role: UserRole;
  patientId?: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface WeightTrendPoint {
  sessionId: string;
  sessionDate: string;
  preWeightKg?: number | null;
  postWeightKg?: number | null;
  status: string;
}

export interface PropertyGraphTrends {
  neo4jAvailable: boolean;
  neo4jMessage?: string;
  neo4jUri?: string;
  recurringSymptoms?: { symptom: string; sessionCount: number }[];
  dizzinessSessionCount?: number;
  sessions?: Record<string, unknown>[];
  error?: string;
}

export interface PatientTrendsResponse {
  patientId: string;
  patientName: string;
  weightTrend: WeightTrendPoint[];
  recentAlerts: ClinicalAlert[];
  propertyGraph: PropertyGraphTrends;
}
