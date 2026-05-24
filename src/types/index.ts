export interface Patient {
  id: string;
  name: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other' | string;
  medicalRecordNumber: string;
  dialysisStartDate?: string;
  dialysisSince?: string;
}

export interface PreDialysisAssessment {
  weightKg?: number | null;
  bloodPressure?: string;
  pulse?: number | null;
  temperature?: number | null;
  bloodSugar?: number | null;
  accessCondition?: string;
  ufGoal?: string;
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
  role: 'patient' | 'clinician';
  patientId?: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
