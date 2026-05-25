const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://168.144.93.105:31175";

import type {
  ClinicalAlert,
  ClinicalCheck,
  DialysisSession,
  PatientOverview,
  PatientTrendsResponse,
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
    potassiumMmolL: raw.potassium_mmol_l as number | null | undefined,
  };
}

function mapVitalReading(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    sessionId: String(raw.session_id),
    intervalMinutes: Number(raw.interval_minutes ?? 0),
    label: raw.label as string | undefined,
    bloodPressure: raw.blood_pressure as string | undefined,
    pulse: raw.pulse as number | null | undefined,
    potassiumMmolL: raw.potassium_mmol_l as number | null | undefined,
    ufRemovedLiters: raw.uf_removed_liters as number | null | undefined,
    notes: raw.notes as string | undefined,
    recordedAt: raw.recorded_at as string | undefined,
  };
}

function mapVitalsWorkflow(raw: Record<string, unknown>) {
  return {
    intervalMinutes: Number(raw.interval_minutes ?? 30),
    sessionStartedAt: raw.session_started_at as string | undefined,
    readings: (raw.readings ?? []).map((r: Record<string, unknown>) => mapVitalReading(r)),
    slots: (raw.slots ?? []).map((s: Record<string, unknown>) => ({
      intervalMinutes: Number(s.interval_minutes),
      label: String(s.label),
      status: s.status as 'recorded' | 'pending',
    })),
    nextDue: raw.next_due
      ? {
          intervalMinutes: Number((raw.next_due as Record<string, unknown>).interval_minutes),
          label: String((raw.next_due as Record<string, unknown>).label),
          dueAt: (raw.next_due as Record<string, unknown>).due_at as string | undefined,
        }
      : null,
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

export async function loginApi(
  role: 'patient' | 'admin',
  options?: { patientId?: string; username?: string; password?: string }
) {
  const body: Record<string, string> = { role };
  if (options?.patientId) body.patient_id = options.patientId;
  if (options?.username) body.username = options.username;
  if (options?.password) body.password = options.password;

  return apiRequest('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function fetchPatientsOverview(): Promise<{
  patients: PatientOverview[];
  totalPatients: number;
}> {
  const data = await apiRequest('/patients/overview');
  return {
    totalPatients: data.totalPatients ?? data.patients?.length ?? 0,
    patients: (data.patients ?? []).map((p: Record<string, unknown>) => ({
      id: String(p.id),
      name: String(p.name),
      age: p.age as number | string,
      gender: String(p.gender ?? ''),
      medicalRecordNumber: String(p.medicalRecordNumber ?? ''),
      createdAt: p.createdAt as string | undefined,
      sessionCount: Number(p.sessionCount ?? 0),
      noteCount: Number(p.noteCount ?? 0),
      attachmentCount: Number(p.attachmentCount ?? 0),
      alertCount: Number(p.alertCount ?? 0),
      sessions: (p.sessions ?? []).map(mapSession),
    })),
  };
}

export async function deleteSession(sessionId: string) {
  return apiRequest(`/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function createPatient(payload: {
  name: string;
  age?: number;
  gender?: string;
}) {
  return apiRequest('/patients/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deletePatient(patientId: string): Promise<{
  message: string;
  sessions_removed?: number;
}> {
  return apiRequest(`/patients/${patientId}`, { method: 'DELETE' });
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
  potassium_mmol_l?: number;
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
  vitalReadings: import('@/types').SessionVitalReading[];
  vitalsWorkflow: import('@/types').VitalsWorkflowState | null;
}> {
  const data = await apiRequest(`/sessions/${sessionId}`);
  return {
    session: mapSession(data.session),
    notes: (data.notes ?? []).map(mapNote),
    attachments: (data.attachments ?? []).map(mapAttachment),
    alerts: (data.alerts ?? []).map(mapAlert),
    vitalReadings: (data.vital_readings ?? []).map(mapVitalReading),
    vitalsWorkflow: data.vitals_workflow
      ? mapVitalsWorkflow(data.vitals_workflow)
      : null,
  };
}

export async function getVitalsWorkflow(
  sessionId: string,
  intervalMinutes = 30
) {
  const data = await apiRequest(
    `/sessions/${sessionId}/vitals/workflow?interval_minutes=${intervalMinutes}`
  );
  return mapVitalsWorkflow(data);
}

export async function recordSessionVitals(
  sessionId: string,
  payload: {
    blood_pressure?: string;
    pulse?: number;
    potassium_mmol_l?: number;
    uf_removed_liters?: number;
    notes?: string;
    interval_minutes?: number;
    label?: string;
  }
): Promise<{
  reading: import('@/types').SessionVitalReading;
  workflow: import('@/types').VitalsWorkflowState;
  alerts: ClinicalAlert[];
  checks: ClinicalCheck[];
}> {
  const data = await apiRequest(`/sessions/${sessionId}/vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return {
    reading: mapVitalReading(data.reading),
    workflow: mapVitalsWorkflow(data.workflow),
    alerts: (data.alerts ?? []).map(mapAlert),
    checks: data.checks ?? [],
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

export async function fetchPatientTrends(patientId: string): Promise<PatientTrendsResponse> {
  const data = await apiRequest(`/patients/${patientId}/trends`);
  const pg = data.property_graph ?? {};
  return {
    patientId: String(data.patient_id),
    patientName: String(data.patient_name ?? ''),
    weightTrend: (data.weight_trend ?? []).map((w: Record<string, unknown>) => ({
      sessionId: String(w.session_id),
      sessionDate: String(w.session_date),
      preWeightKg: w.pre_weight_kg as number | null | undefined,
      postWeightKg: w.post_weight_kg as number | null | undefined,
      status: String(w.status ?? ''),
    })),
    recentAlerts: (data.recent_alerts ?? []).map(mapAlert),
    propertyGraph: {
      neo4jAvailable: pg.neo4j_available === true,
      recurringSymptoms: (pg.recurring_symptoms ?? []).map(
        (r: Record<string, unknown>) => ({
          symptom: String(r.symptom ?? ''),
          sessionCount: Number(r.sessionCount ?? r.session_count ?? 0),
        })
      ),
      dizzinessSessionCount: Number(pg.dizziness_session_count ?? 0),
      sessions: pg.sessions,
      error: pg.error as string | undefined,
    },
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
