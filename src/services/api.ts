const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://168.144.93.105:31175";

async function apiRequest(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${message}`);
  }
  return res.json();
}

export async function fetchPatients() {
  const data = await apiRequest('/patients');
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
}) {
  return apiRequest('/sessions/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getPatientSessions(patientId: string) {
  return apiRequest(`/patients/${patientId}/sessions`);
}

export async function getSession(sessionId: string) {
  return apiRequest(`/sessions/${sessionId}`);
}

export async function addNote(sessionId: string, noteText: string) {
  return apiRequest(`/sessions/${sessionId}/note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_text: noteText }),
  });
}

export async function closeSession(sessionId: string) {
  return apiRequest(`/sessions/${sessionId}/end`, {
    method: 'POST',
  });
}

export async function uploadAttachment(
  sessionId: string,
  file: File,
  fileType: 'image' | 'pdf' | 'audio'
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);

  const res = await fetch(`${API_BASE}/sessions/${sessionId}/attachment`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${message}`);
  }
  return res.json();
}