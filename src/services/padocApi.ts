const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://168.144.93.105:31175';

async function padocRequest(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(formatPadocError(res.status, message));
  }
  return res.json();
}

function formatPadocError(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown };
    if (typeof parsed.detail === 'string' && parsed.detail.trim()) return parsed.detail;
    if (Array.isArray(parsed.detail)) {
      return parsed.detail
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join('; ');
    }
    if (parsed.detail != null) return JSON.stringify(parsed.detail);
  } catch {
    /* not JSON */
  }
  return body.trim() || `Request failed (${status})`;
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

export const PADOC_INGEST_MAX_BYTES = 15 * 1024 * 1024;
export const PADOC_INGEST_ACCEPT =
  '.pdf,.xlsx,.xls,.docx,.doc,.csv,.jpeg,.jpg,.png,.gif,.webp,application/pdf,image/jpeg,image/png,image/gif,image/webp';

const PADOC_INGEST_EXTENSIONS = new Set([
  'pdf',
  'xlsx',
  'xls',
  'docx',
  'doc',
  'csv',
  'jpeg',
  'jpg',
  'png',
  'gif',
  'webp',
]);

export function padocIngestFileError(file: File): string | null {
  const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? '' : '';
  if (!PADOC_INGEST_EXTENSIONS.has(ext)) {
    return 'Unsupported file type. Use PDF, Excel, Word, CSV, or jpeg/png/gif/webp.';
  }
  if (file.size > PADOC_INGEST_MAX_BYTES) {
    return 'File too large. Maximum size is 15 MB.';
  }
  return null;
}

export type PadocIngestPreview = {
  persisted: boolean;
  source?: {
    filename?: string;
    format?: string;
    parse_mode?: string;
  };
  classification?: {
    document_type?: string;
    domain?: string;
    title?: string;
    summary?: string;
    confidence?: number;
  };
  schema?: {
    postgres?: {
      tables?: {
        name: string;
        description?: string;
        columns?: {
          name: string;
          type: string;
          nullable?: boolean;
          description?: string;
        }[];
      }[];
    };
    knowledge_graph?: {
      nodes?: { label: string; key: string; properties?: string[] }[];
      relationships?: { type: string; from: string; to: string; description?: string }[];
    };
  };
  preview?: {
    records?: Record<string, unknown>[];
    warnings?: string[];
  };
};

export async function previewPadocIngest(file: File): Promise<PadocIngestPreview> {
  const form = new FormData();
  form.append('file', file);
  return padocRequest('/padoc/ingest/preview', {
    method: 'POST',
    body: form,
  });
}

export function padocFileAbsoluteUrl(fileUrl: string | null | undefined): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${API_BASE}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}
