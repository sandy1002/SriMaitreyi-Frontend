export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  medicalRecordNumber: string;
  dialysisStartDate: string;
}

export interface DialysisSession {
  id: string;
  patientId: string;
  sessionDate: string;
  hospitalName: string;
  status: 'in-progress' | 'completed';
  createdAt: string;
  summary?: string;
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
  fileType: 'image' | 'pdf' | 'audio';
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
