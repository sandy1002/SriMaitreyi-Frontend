const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://168.144.93.105:31175';

async function padocRequest(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}: ${message}`);
  }
  return res.json();
}

export type PadocDocument = {
  id: string;
  doctorId: string;
  title: string;
  dataKind: string;
  notes?: string | null;
  structuredData?: unknown;
  fileName?: string | null;
  fileType?: string | null;
  filePath?: string | null;
  fileUrl?: string | null;
  extractedPanels?: unknown;
  reviewStatus: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  extractionWarning?: string | null;
};

function mapDocument(raw: Record<string, unknown>): PadocDocument {
  return {
    id: String(raw.id),
    doctorId: String(raw.doctor_id),
    title: String(raw.title ?? 'Untitled'),
    dataKind: String(raw.data_kind ?? 'unstructured'),
    notes: (raw.notes as string | null | undefined) ?? null,
    structuredData: raw.structured_data,
    fileName: (raw.file_name as string | null | undefined) ?? null,
    fileType: (raw.file_type as string | null | undefined) ?? null,
    filePath: (raw.file_path as string | null | undefined) ?? null,
    fileUrl: (raw.file_url as string | null | undefined) ?? null,
    extractedPanels: raw.extracted_panels,
    reviewStatus: String(raw.review_status ?? 'none'),
    createdAt: (raw.created_at as string | null | undefined) ?? null,
    updatedAt: (raw.updated_at as string | null | undefined) ?? null,
    extractionWarning: (raw.extraction_warning as string | null | undefined) ?? null,
  };
}

export async function padocLogin(username: string, password: string) {
  return padocRequest('/padoc/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchPadocDocuments(doctorId: string): Promise<PadocDocument[]> {
  const data = await padocRequest(`/padoc/doctors/${doctorId}/documents`);
  return (data.items ?? []).map((item: Record<string, unknown>) => mapDocument(item));
}

export async function createPadocDocument(
  doctorId: string,
  payload: {
    title: string;
    dataKind?: string;
    notes?: string;
    structuredData?: unknown;
  }
): Promise<PadocDocument> {
  const data = await padocRequest(`/padoc/doctors/${doctorId}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      data_kind: payload.dataKind ?? 'unstructured',
      notes: payload.notes,
      structured_data: payload.structuredData,
    }),
  });
  return mapDocument(data.item as Record<string, unknown>);
}

export async function deletePadocDocument(doctorId: string, documentId: string): Promise<void> {
  await padocRequest(`/padoc/doctors/${doctorId}/documents/${documentId}`, {
    method: 'DELETE',
  });
}

export async function scanPadocDocument(
  doctorId: string,
  file: File,
  options?: { title?: string; fieldHints?: string }
): Promise<PadocDocument> {
  const form = new FormData();
  form.append('file', file);
  if (options?.title) form.append('title', options.title);
  if (options?.fieldHints) form.append('field_hints', options.fieldHints);
  const data = await padocRequest(`/padoc/doctors/${doctorId}/documents/scan`, {
    method: 'POST',
    body: form,
  });
  return mapDocument(data.item as Record<string, unknown>);
}

export function padocFileAbsoluteUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${API_BASE}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}
