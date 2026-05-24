const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://168.144.93.105:31175";

import type {
  ClinicalAlert,
  ClinicalCheck,
  DialysisSession,
  SessionAttachment,
  SessionNote,
} from '@/types';

async function apiRequest(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${message}`);
  }
  return res.json();
}

function mapPreAssessment(raw: Record<string, unknown> | null | undefined) {
  if (!raw) return undefined;
  return {
    weightKg: raw.weight_kg as number | undefined,
    bloodPressure: raw.blood_pressure as string | undefined,
    pulse: raw.pulse as number | undefined,
    temperature: raw.temperature as number | undefined,
    bloodSugar: raw.blood_sugar as number | undefined,
    accessCondition: raw.access_condition as string | undefined,
    ufGoal: raw.uf_goal as string | undefined,
  };
}

function mapPostAssessment(raw: Record<string, unknown> | null | undefined) {
  if (!raw) return undefined;
  return {
    postWeightKg: raw.post_weight_kg as number | undefined,
    postBp: raw.post_bp as string | undefined,
    totalUfRemoved: raw.total_uf_removed as number | undefined,
    condition: raw.condition as string | undefined,
    technicianName: raw.technician_name as string | undefined,
    nurseName: raw.nurse_name as string | undefined,
    doctorName: raw.doctor_name as string | undefined,
  };
}

export function mapSession(raw: Record<string, unknown>): DialysisSession {
  return {
    id: String(raw.id),
    patientId: String(raw.patient_id),
    sessionDate: String(raw.session_date),
    hospitalName: String(raw.hospital_name),
    status: raw.status as DialysisSession['status'],
    createdAt: String(raw.created_at ?? ''),
    summary: raw.summary as string | undefined,
    preDialysisAssessment: mapPreAssessment(
      raw.pre_dialysis_assessment as Record<string, unknown>
    ),
    postDialysisAssessment: mapPostAssessment(
      raw.post_dialysis_assessment as Record<string, unknown>
    ),
  };
}

function mapNote(raw: Record<string, unknown>): SessionNote {
  return {
    id: String(raw.id),
    sessionId: String(raw.session_id),
    noteText: String(raw.note_text),
    createdAt: String(raw.created_at ?? ''),
  };
}

function mapAttachment(raw: Record<string, unknown>): SessionAttachment {
  const fileType = String(raw.file_type ?? 'document');
  return {
    id: String(raw.id),
    sessionId: String(raw.session_id),
    fileName: String(raw.file_name ?? ''),
    fileType: fileType as SessionAttachment['fileType'],
    fileUrl: String(raw.file_url ?? ''),
    uploadedAt: String(raw.uploaded_at ?? ''),
  };
}

function mapAlert(raw: Record<string, unknown>): ClinicalAlert {
  return {
    id: String(raw.id),
    sessionId: String(raw.session_id),
    patientId: String(raw.patient_id),
    severity: String(raw.severity),
    code: String(raw.code),
    message: String(raw.message),
    evidence: raw.evidence as Record<string, unknown> | undefined,
    createdAt: raw.created_at as string | undefined,
  };
}

export async function fetchPatients() {
  const data = await apiRequest('/patients/');
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.patients)) return data.patients;
  return [];
}

export async function loginApi(patientId: string, role: 'patient' | 'clinician') {
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, role }),
  });
}

export async function createSession(payload: {
  patient_id: string;
  session_date: string;
  hospital_name: string;
  weight_kg: number;
  blood_pressure: string;
  pulse: number;
  temperature: number;
  blood_sugar: number;
  access_condition: 'Normal' | 'Abnormal';
  uf_goal: string;
}): Promise<{
  session: DialysisSession;
  alerts: ClinicalAlert[];
  checks: ClinicalCheck[];
}> {
  const data = await apiRequest('/sessions/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return {
    session: mapSession(data.session),
    alerts: (data.alerts ?? []).map(mapAlert),
    checks: data.checks ?? [],
  };
}

export async function getPatientSessions(patientId: string): Promise<DialysisSession[]> {
  const data = await apiRequest(`/patients/${patientId}/sessions`);
  return (data ?? []).map(mapSession);
}

export async function getSession(sessionId: string): Promise<{
  session: DialysisSession;
  notes: SessionNote[];
  attachments: SessionAttachment[];
  alerts: ClinicalAlert[];
}> {
  const data = await apiRequest(`/sessions/${sessionId}`);
  return {
    session: mapSession(data.session),
    notes: (data.notes ?? []).map(mapNote),
    attachments: (data.attachments ?? []).map(mapAttachment),
    alerts: (data.alerts ?? []).map(mapAlert),
  };
}

export async function addNote(
  sessionId: string,
  noteText: string
): Promise<{
  note: SessionNote;
  alerts: ClinicalAlert[];
  checks: ClinicalCheck[];
}> {
  const data = await apiRequest(`/sessions/${sessionId}/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_text: noteText }),
  });
  return {
    note: mapNote(data.note),
    alerts: (data.alerts ?? []).map(mapAlert),
    checks: data.checks ?? [],
  };
}

export async function closeSession(
  sessionId: string,
  payload: {
    post_weight_kg?: number;
    post_bp?: string;
    total_uf_removed?: number;
    condition?: 'Stable' | 'Unstable';
    technician_name?: string;
    nurse_name?: string;
    doctor_name?: string;
  }
): Promise<{
  session: DialysisSession;
  alerts: ClinicalAlert[];
  checks: ClinicalCheck[];
}> {
  const data = await apiRequest(`/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return {
    session: mapSession(data.session),
    alerts: (data.alerts ?? []).map(mapAlert),
    checks: data.checks ?? [],
  };
}

export async function uploadAttachment(
  sessionId: string,
  file: File,
  _fileType: 'image' | 'pdf' | 'audio'
): Promise<SessionAttachment> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/sessions/${sessionId}/attachment`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${message}`);
  }
  const data = await res.json();
  return mapAttachment(data);
}

export async function askClinicalAgent(
  patientId: string,
  question: string
): Promise<{
  answer: string;
  alerts: ClinicalAlert[];
  checks: ClinicalCheck[];
}> {
  const data = await apiRequest('/agent/clinical-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, question }),
  });
  return {
    answer: data.answer,
    alerts: (data.alerts ?? []).map(mapAlert),
    checks: data.checks ?? [],
  };
}

export async function getPatientAlerts(patientId: string): Promise<ClinicalAlert[]> {
  const sessions = await getPatientSessions(patientId);
  const allAlerts: ClinicalAlert[] = [];
  for (const s of sessions.slice(0, 5)) {
    const detail = await getSession(s.id);
    allAlerts.push(...detail.alerts);
  }
  return allAlerts;
}
