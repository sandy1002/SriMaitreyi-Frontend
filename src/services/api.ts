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
    sodiumProfile: raw.sodium_profile as number | null | undefined,
    ufProfile: raw.uf_profile as number | null | undefined,
    targetDryWeightKg: raw.target_dry_weight_kg as number | null | undefined,
    primeRinsebackMl: raw.prime_rinseback_ml as number | null | undefined,
    ivFluidsMl: raw.iv_fluids_ml as number | null | undefined,
    oralIntakeMl: raw.oral_intake_ml as number | null | undefined,
    idwgKg: raw.idwg_kg as number | null | undefined,
    fluidAddedLiters: raw.fluid_added_liters as number | null | undefined,
    ufGoalLiters: raw.uf_goal_liters as number | null | undefined,
    technicianName: raw.technician_name as string | undefined,
    nurseName: raw.nurse_name as string | undefined,
    doctorName: raw.doctor_name as string | undefined,
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
    intervalMinutes: raw.interval_minutes != null ? Number(raw.interval_minutes) : undefined,
    sessionStartedAt: raw.session_started_at as string | undefined,
    currentTime: raw.current_time as string | undefined,
    readings: (raw.readings ?? []).map((r: Record<string, unknown>) => mapVitalReading(r)),
    slots: (raw.slots ?? []).map((s: Record<string, unknown>) => ({
      intervalMinutes: Number(s.interval_minutes),
      label: String(s.label),
      status: s.status as 'recorded' | 'pending',
    })),
    workflowActive: raw.workflow_active as boolean | undefined,
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
    postPotassiumMmolL: raw.post_potassium_mmol_l as number | null | undefined,
    postBloodSugar: raw.post_blood_sugar as number | null | undefined,
  };
}

function mapSessionMedicationIntake(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    sessionId: String(raw.session_id),
    medicineId: raw.medicine_id as string | undefined,
    medicineName: raw.medicine_name as string | undefined,
    doseText: raw.dose_text as string | undefined,
    doseUnit: raw.dose_unit as string | undefined,
    route: raw.route as string | undefined,
    takenAt: raw.taken_at as string | undefined,
    notes: raw.notes as string | undefined,
    createdAt: raw.created_at as string | undefined,
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

function parseContentDispositionFilename(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch) return decodeURIComponent(utfMatch[1]);
  const plain = header.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : fallback;
}

export type MedicalReportType = 'summary' | 'detailed';
export type MedicalReportDisposition = 'inline' | 'attachment';

export const MEDICAL_REPORT_OPTIONS: {
  value: MedicalReportType;
  label: string;
  description: string;
}[] = [
  {
    value: 'summary',
    label: 'Short summary',
    description: 'Short, crisp overview with key clinical data',
  },
  {
    value: 'detailed',
    label: 'Detailed summary',
    description: 'Full report with session, nutrition, and diary details',
  },
];

export function medicalReportLabel(reportType: MedicalReportType): string {
  return (
    MEDICAL_REPORT_OPTIONS.find((option) => option.value === reportType)?.label ??
    'Report'
  );
}

function medicalReportUrl(
  patientId: string,
  days: number,
  reportType: MedicalReportType,
  disposition: MedicalReportDisposition
): string {
  const params = new URLSearchParams({
    days: String(days),
    format: 'pdf',
    report_type: reportType,
    disposition,
  });
  return `${API_BASE}/patients/${patientId}/medical-report?${params.toString()}`;
}

export async function fetchMedicalReportPdf(
  patientId: string,
  days: number,
  reportType: MedicalReportType = 'detailed',
  disposition: MedicalReportDisposition = 'inline'
): Promise<Blob> {
  const res = await fetch(medicalReportUrl(patientId, days, reportType, disposition));
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Report ${res.status}: ${message}`);
  }
  return res.blob();
}

export async function downloadMedicalReport(
  patientId: string,
  days: number,
  patientName?: string,
  reportType: MedicalReportType = 'detailed'
): Promise<void> {
  const res = await fetch(
    medicalReportUrl(patientId, days, reportType, 'attachment')
  );
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Report ${res.status}: ${message}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = (patientName || 'patient').replace(/\s+/g, '_');
  const fallback = `${safeName}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`;
  anchor.href = url;
  anchor.download = parseContentDispositionFilename(
    res.headers.get('Content-Disposition'),
    fallback
  );
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function fetchPatients() {
  const data = await apiRequest('/patients/');
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.patients)) return data.patients;
  return [];
}

export async function loginApi(
  role: 'patient' | 'admin' | 'technician' | 'doctor' | 'nutrition',
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

export async function fetchOpenSession(patientId: string) {
  const data = await apiRequest(`/patients/${patientId}/open-session`);
  return data.session ? mapSession(data.session) : null;
}

export async function fetchSessionDefaults(
  patientId: string,
  sessionDate?: string
): Promise<import('@/types').SessionStartDefaults> {
  const qs = sessionDate ? `?session_date=${encodeURIComponent(sessionDate)}` : '';
  const data = await apiRequest(`/patients/${patientId}/session-defaults${qs}`);
  const fluids = data.interdialytic_fluids as Record<string, unknown> | undefined;
  const nutritionK = data.interdialytic_nutrition_potassium as Record<string, unknown> | undefined;
  const prevPost = data.previous_session_post_weight as Record<string, unknown> | undefined;
  return {
    hospitalName: (data.hospital_name as string) ?? null,
    previousSessionPostWeight: prevPost?.post_weight_kg != null
      ? {
          sessionId: String(prevPost.session_id ?? ''),
          sessionDate: String(prevPost.session_date ?? ''),
          hospitalName: (prevPost.hospital_name as string) ?? null,
          postWeightKg: Number(prevPost.post_weight_kg),
        }
      : null,
    suggestedPrimeRinsebackMl: Number(data.suggested_prime_rinseback_ml ?? 250),
    suggestedIvFluidsMl: Number(data.suggested_iv_fluids_ml ?? 0),
    suggestedOralIntakeMl: Number(data.suggested_oral_intake_ml ?? 450),
    interdialyticFluids: fluids
      ? {
          lastSessionId: fluids.last_session_id as string | null,
          lastSessionDate: fluids.last_session_date as string | null,
          fromDate: fluids.from_date as string | null,
          untilDate: fluids.until_date as string,
          totalOralMl: Number(fluids.total_oral_ml ?? 0),
          totalIvMl: Number(fluids.total_iv_ml ?? 0),
          totalPrimeRinsebackMl: Number(fluids.total_prime_rinseback_ml ?? 0),
          totalOtherMl: Number(fluids.total_other_ml ?? 0),
          totalMl: Number(fluids.total_ml ?? 0),
          totalLiters: Number(fluids.total_liters ?? 0),
          dailyEntries: (fluids.daily_entries ?? []) as import('@/types').InterdialyticFluidsSummary['dailyEntries'],
        }
      : null,
    interdialyticNutritionPotassium: nutritionK
      ? {
          fromDate: nutritionK.from_date as string | null,
          untilDate: nutritionK.until_date as string,
          lastSessionCompletedAt: (nutritionK.last_session_completed_at as string) ?? null,
          newSessionDate: (nutritionK.new_session_date as string) ?? undefined,
          totalPotassiumMg: Number(nutritionK.total_potassium_mg ?? 0),
          dayCount: Number(nutritionK.day_count ?? 0),
          dailyEntries: ((nutritionK.daily_entries ?? []) as Record<string, unknown>[]).map((d) => ({
            diaryDate: String(d.diary_date ?? ''),
            totalPotassiumMg: Number(d.total_potassium_mg ?? 0),
          })),
          mealsInWindow: ((nutritionK.meals_in_window ?? []) as Record<string, unknown>[]).map((m) => ({
            diaryDate: String(m.diary_date ?? ''),
            mealType: String(m.meal_type ?? ''),
            foodName: m.food_name as string | undefined,
            mealTakenAt: m.meal_taken_at as string | undefined,
            potassiumMg: Number(m.potassium_mg ?? 0),
          })),
        }
      : null,
    latestSerumPotassium: data.latest_serum_potassium
      ? {
          reportDate: (data.latest_serum_potassium as Record<string, unknown>).report_date as string,
          serumPotassiumMmolL: Number(
            (data.latest_serum_potassium as Record<string, unknown>).serum_potassium_mmol_l
          ),
        }
      : null,
    patientMedications: (data.patient_medications ?? []).map((m: Record<string, unknown>) => ({
      id: String(m.id),
      medicineId: String(m.medicine_id),
      doseSchedule: m.dose_schedule as string | undefined,
      medicine: m.medicine as Record<string, unknown> | undefined,
    })),
  };
}

function mapFoodPotassiumItem(item: Record<string, unknown>) {
  return {
    id: String(item.id),
    name: String(item.name),
    category: String(item.category),
    servingDescription: String(item.serving_description ?? ''),
    servingGrams: item.serving_grams as number | undefined,
    potassiumMgPerServing: Number(item.potassium_mg_per_serving),
    proteinGPerServing: item.protein_g_per_serving as number | null | undefined,
    kcalPerServing: item.kcal_per_serving as number | null | undefined,
    sodiumMgPerServing: item.sodium_mg_per_serving as number | null | undefined,
    phosphorusMgPerServing: item.phosphorus_mg_per_serving as number | null | undefined,
    potassiumMgPer100g: item.potassium_mg_per_100g as number | null | undefined,
    proteinGPer100g: item.protein_g_per_100g as number | null | undefined,
    kcalPer100g: item.kcal_per_100g as number | null | undefined,
    sodiumMgPer100g: item.sodium_mg_per_100g as number | null | undefined,
    phosphorusMgPer100g: item.phosphorus_mg_per_100g as number | null | undefined,
    aliases: item.aliases as string | undefined,
    isCustom: Boolean(item.is_custom),
    patientId: (item.patient_id as string) ?? null,
  };
}

export async function fetchFoodPotassiumList(
  patientId?: string,
  limit = 200,
  offset = 0
): Promise<import('@/types').FoodPotassiumItem[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (patientId) params.set('patient_id', patientId);
  const data = await apiRequest(`/food-items?${params.toString()}`);
  return (data.items ?? []).map((item: Record<string, unknown>) => mapFoodPotassiumItem(item));
}

/** Load the full catalog (paginated) for manage-food UI. */
export async function fetchAllFoodPotassiumList(
  patientId?: string,
  searchQuery = ''
): Promise<import('@/types').FoodPotassiumItem[]> {
  const pageSize = 250;
  let offset = 0;
  const all: import('@/types').FoodPotassiumItem[] = [];
  for (;;) {
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
    });
    if (patientId) params.set('patient_id', patientId);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    const data = await apiRequest(`/food-items?${params.toString()}`);
    const batch = (data.items ?? []).map((item: Record<string, unknown>) =>
      mapFoodPotassiumItem(item)
    );
    all.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

export async function searchFoodPotassiumItems(
  query: string,
  category?: string,
  patientId?: string
): Promise<import('@/types').FoodPotassiumItem[]> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  if (patientId) params.set('patient_id', patientId);
  const data = await apiRequest(`/food-items?${params.toString()}`);
  return (data.items ?? []).map((item: Record<string, unknown>) => mapFoodPotassiumItem(item));
}

export async function createCustomFoodPotassiumItem(payload: {
  patientId: string;
  name: string;
  potassiumMgPerServing: number;
  proteinGPerServing?: number;
  kcalPerServing?: number;
  sodiumMgPerServing?: number;
  phosphorusMgPerServing?: number;
  servingDescription?: string;
  servingGrams?: number;
}): Promise<import('@/types').FoodPotassiumItem> {
  const data = await apiRequest('/food-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: payload.patientId,
      name: payload.name,
      potassium_mg_per_serving: payload.potassiumMgPerServing,
      protein_g_per_serving: payload.proteinGPerServing,
      kcal_per_serving: payload.kcalPerServing,
      sodium_mg_per_serving: payload.sodiumMgPerServing,
      phosphorus_mg_per_serving: payload.phosphorusMgPerServing,
      serving_description: payload.servingDescription ?? '100 g',
      serving_grams: payload.servingGrams ?? 100,
      category: 'custom',
    }),
  });
  const item = data.item as Record<string, unknown>;
  return mapFoodPotassiumItem(item);
}

export async function updateFoodPotassiumItem(
  foodId: string,
  payload: {
    patientId?: string;
    editGlobal?: boolean;
    name?: string;
    potassiumMgPerServing?: number;
    proteinGPerServing?: number;
    kcalPerServing?: number;
    sodiumMgPerServing?: number;
    phosphorusMgPerServing?: number;
    servingDescription?: string;
    servingGrams?: number;
  }
): Promise<import('@/types').FoodPotassiumItem> {
  const data = await apiRequest(`/food-items/${foodId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: payload.patientId,
      edit_global: payload.editGlobal ?? false,
      name: payload.name,
      potassium_mg_per_serving: payload.potassiumMgPerServing,
      protein_g_per_serving: payload.proteinGPerServing,
      kcal_per_serving: payload.kcalPerServing,
      sodium_mg_per_serving: payload.sodiumMgPerServing,
      phosphorus_mg_per_serving: payload.phosphorusMgPerServing,
      serving_description: payload.servingDescription,
      serving_grams: payload.servingGrams,
    }),
  });
  const item = data.item as Record<string, unknown>;
  return mapFoodPotassiumItem(item);
}

export async function calculateFoodPotassium(payload: {
  foodItemId?: string;
  foodName?: string;
  portionSize?: string;
  servings?: number;
  patientId?: string;
}): Promise<{
  potassiumMg: number;
  proteinG: number | null;
  kcal: number | null;
  sodiumMg: number | null;
  phosphorusMg: number | null;
  servingDescription: string;
}> {
  const data = await apiRequest('/food-items/calculate-potassium', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      food_item_id: payload.foodItemId,
      food_name: payload.foodName,
      portion_size: payload.portionSize,
      servings: payload.servings ?? 1,
      patient_id: payload.patientId,
    }),
  });
  return {
    potassiumMg: Number(data.potassium_mg),
    proteinG: data.protein_g != null ? Number(data.protein_g) : null,
    kcal: data.kcal != null ? Number(data.kcal) : null,
    sodiumMg: data.sodium_mg != null ? Number(data.sodium_mg) : null,
    phosphorusMg: data.phosphorus_mg != null ? Number(data.phosphorus_mg) : null,
    servingDescription: String(data.serving_description ?? ''),
  };
}

export async function calculateUfGoal(payload: {
  pre_weight_kg: number;
  target_dry_weight_kg: number;
  prime_rinseback_ml?: number;
  iv_fluids_ml?: number;
  oral_intake_ml?: number;
}): Promise<import('@/types').UfGoalCalculation> {
  const data = await apiRequest('/sessions/uf-goal/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return {
    idwgKg: data.idwg_kg,
    fluidAddedLiters: data.fluid_added_liters,
    ufGoalLiters: data.uf_goal_liters,
    ufGoal: data.uf_goal,
  };
}

export async function createSession(payload: Record<string, unknown>): Promise<{
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
  medicationIntakes: import('@/types').SessionMedicationIntake[];
  alerts: ClinicalAlert[];
  vitalReadings: import('@/types').SessionVitalReading[];
  vitalsWorkflow: import('@/types').VitalsWorkflowState | null;
}> {
  const data = await apiRequest(`/sessions/${sessionId}`);
  return {
    session: mapSession(data.session),
    notes: (data.notes ?? []).map(mapNote),
    attachments: (data.attachments ?? []).map(mapAttachment),
    medicationIntakes: (data.medication_intakes ?? []).map(mapSessionMedicationIntake),
    alerts: (data.alerts ?? []).map(mapAlert),
    vitalReadings: (data.vital_readings ?? []).map(mapVitalReading),
    vitalsWorkflow: data.vitals_workflow
      ? mapVitalsWorkflow(data.vitals_workflow)
      : null,
  };
}

export async function updateSession(
  sessionId: string,
  payload: Record<string, unknown>
): Promise<{
  session: DialysisSession;
  alerts: ClinicalAlert[];
  checks: ClinicalCheck[];
}> {
  const data = await apiRequest(`/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return {
    session: mapSession(data.session),
    alerts: (data.alerts ?? []).map(mapAlert),
    checks: data.checks ?? [],
  };
}

export async function updatePostPotassium(
  sessionId: string,
  postPotassiumMmolL: number
): Promise<{ session: DialysisSession; alerts: ClinicalAlert[]; checks: ClinicalCheck[] }> {
  const data = await apiRequest(`/sessions/${sessionId}/post-potassium`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_potassium_mmol_l: postPotassiumMmolL }),
  });
  return {
    session: mapSession(data.session),
    alerts: (data.alerts ?? []).map(mapAlert),
    checks: data.checks ?? [],
  };
}

export async function addSessionMedication(
  sessionId: string,
  payload: {
    medicine_id?: string;
    medicine_name?: string;
    dose_text?: string;
    route?: string;
    taken_at?: string;
    notes?: string;
  }
) {
  const data = await apiRequest(`/sessions/${sessionId}/medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return mapSessionMedicationIntake(data);
}

export async function getVitalsWorkflow(sessionId: string) {
  const data = await apiRequest(`/sessions/${sessionId}/vitals/workflow`);
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
    post_potassium_mmol_l?: number;
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
      neo4jMessage: (pg.neo4j_message as string | undefined) ?? undefined,
      neo4jUri: (pg.neo4j_uri as string | undefined) ?? undefined,
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

function mapMedicine(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    name: String(raw.name),
    genericName: raw.generic_name as string | undefined,
    category: String(raw.category ?? 'other'),
    unit: raw.unit as string | undefined,
    description: raw.description as string | undefined,
    active: raw.active as boolean | undefined,
  };
}

function sumMealNutrient(
  meals: { nutrients?: { nutrientCode: string; amount?: number | null }[] }[],
  code: string
): number | null {
  let total = 0;
  let found = false;
  for (const m of meals) {
    for (const n of m.nutrients ?? []) {
      if (n.nutrientCode?.toUpperCase() === code && n.amount != null) {
        total += Number(n.amount);
        found = true;
      }
    }
  }
  return found ? Math.round(total * 100) / 100 : null;
}

function sumMealFact(
  meals: { nutritionFacts?: Record<string, unknown> }[],
  key: string
): number | null {
  let total = 0;
  let found = false;
  for (const m of meals) {
    const val = m.nutritionFacts?.[key];
    if (val != null && val !== '') {
      const n = Number(val);
      if (!Number.isNaN(n)) {
        total += n;
        found = true;
      }
    }
  }
  return found ? Math.round(total * 100) / 100 : null;
}

function mapNutritionDiary(raw: Record<string, unknown>) {
  const meals = ((raw.meals as Record<string, unknown>[]) ?? []).map((m) => ({
    id: String(m.id),
    mealType: String(m.meal_type),
    mealTakenAt: m.meal_taken_at as string | undefined,
    foodName: m.food_name as string | undefined,
    portionSize: m.portion_size as string | undefined,
    foodDescription: m.food_description as string | undefined,
    nutritionFacts: (m.nutrition_facts as Record<string, unknown>) ?? {},
    medicalDetails: (m.medical_details as Record<string, unknown>) ?? {},
    nutrients: ((m.nutrients as Record<string, unknown>[]) ?? []).map((n) => ({
      nutrientCode: String(n.nutrient_code),
      amount: n.amount as number | null | undefined,
      unit: String(n.unit),
    })),
  }));

  const proteinFromMeals =
    sumMealNutrient(meals, 'PROTEIN') ?? sumMealFact(meals, 'protein_g');
  const potassiumFromMeals =
    sumMealNutrient(meals, 'POTASSIUM') ?? sumMealFact(meals, 'potassium_mg');
  const kcalFromMeals =
    sumMealNutrient(meals, 'ENERGY') ?? sumMealFact(meals, 'kcal');

  return {
    id: String(raw.id),
    patientId: String(raw.patient_id),
    diaryDate: String(raw.diary_date),
    notesEndOfDay: raw.notes_end_of_day as string | undefined,
    medicineDiary: raw.medicine_diary as string | undefined,
    totalProteinG:
      (raw.total_protein_g as number | null | undefined) ?? proteinFromMeals,
    totalSodiumMg: raw.total_sodium_mg as number | null | undefined,
    totalPhosphorusMg: raw.total_phosphorus_mg as number | null | undefined,
    totalPotassiumMg:
      (raw.total_potassium_mg as number | null | undefined) ?? potassiumFromMeals,
    totalKcal: (raw.total_kcal as number | null | undefined) ?? kcalFromMeals,
    meals,
    alerts: ((raw.alerts as Record<string, unknown>[]) ?? []).map((a) => ({
      id: String(a.id),
      patientId: String(a.patient_id),
      diaryId: String(a.diary_id),
      severity: String(a.severity),
      code: String(a.code),
      message: String(a.message),
    })),
  };
}

export async function fetchMedicines() {
  const data = await apiRequest('/medicines/');
  return (data ?? []).map((m: Record<string, unknown>) => mapMedicine(m));
}

export async function fetchNutritionDiaries(patientId: string) {
  const data = await apiRequest(`/patients/${patientId}/nutrition-diary`);
  return (data.diaries ?? []).map((d: Record<string, unknown>) => mapNutritionDiary(d));
}

export async function saveNutritionDiary(
  patientId: string,
  payload: {
    diary_date: string;
    notes_end_of_day?: string;
    medicine_diary?: string;
    total_protein_g?: number;
    total_potassium_mg?: number;
    total_sodium_mg?: number;
    total_phosphorus_mg?: number;
    meals: import('@/types').NutritionMealInput[];
  }
) {
  const data = await apiRequest(`/patients/${patientId}/nutrition-diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return {
    diary: mapNutritionDiary(data.diary),
    checks: data.checks ?? [],
  };
}

function mapMedicationDiary(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    patientId: String(raw.patient_id),
    diaryDate: String(raw.diary_date),
    notes: raw.notes as string | undefined,
    totalDoses: raw.total_doses as number | null | undefined,
    intakes: ((raw.intakes as Record<string, unknown>[]) ?? []).map((i) => ({
      id: String(i.id),
      medicineId: i.medicine_id as string | undefined,
      medicineName: i.medicine_name as string | undefined,
      doseText: i.dose_text as string | undefined,
      doseUnit: i.dose_unit as string | undefined,
      route: i.route as string | undefined,
      taken: Boolean(i.taken),
      takenTime: i.taken_time as string | undefined,
      notes: i.notes as string | undefined,
    })),
  };
}

export async function fetchMedicationDiaries(patientId: string) {
  const data = await apiRequest(`/patients/${patientId}/medication-diary`);
  return (data.diaries ?? []).map((d: Record<string, unknown>) => mapMedicationDiary(d));
}

export async function saveMedicationDiary(
  patientId: string,
  payload: {
    diary_date: string;
    notes?: string;
    intakes: import('@/types').MedicationDiaryIntakeInput[];
  }
) {
  const data = await apiRequest(`/patients/${patientId}/medication-diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { diary: mapMedicationDiary(data.diary) };
}

function mapFluidDiary(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    patientId: String(raw.patient_id),
    diaryDate: String(raw.diary_date),
    notes: raw.notes as string | undefined,
    totalOralMl: raw.total_oral_ml as number | null | undefined,
    totalIvMl: raw.total_iv_ml as number | null | undefined,
    totalPrimeRinsebackMl: raw.total_prime_rinseback_ml as number | null | undefined,
    totalOtherMl: raw.total_other_ml as number | null | undefined,
    intakes: ((raw.intakes as Record<string, unknown>[]) ?? []).map((i) => ({
      id: String(i.id),
      category: String(i.category),
      description: i.description as string | undefined,
      volumeMl: i.volume_ml as number | null | undefined,
      volumeUnit: (i.volume_unit as string) || 'ml',
      displayVolume: i.display_volume as number | null | undefined,
      recordedTime: i.recorded_time as string | undefined,
    })),
  };
}

export async function fetchInterdialyticFluids(
  patientId: string,
  untilDate: string,
  sessionId?: string
): Promise<import('@/types').InterdialyticPeriodSummary> {
  const params = new URLSearchParams({ until_date: untilDate });
  if (sessionId) params.set('session_id', sessionId);
  const data = await apiRequest(
    `/patients/${patientId}/interdialytic-fluids?${params.toString()}`
  );
  const nutritionK = data.interdialytic_nutrition_potassium as Record<string, unknown> | undefined;
  return {
    fluids: {
      lastSessionId: data.last_session_id as string | null | undefined,
      lastSessionDate: data.last_session_date as string | null | undefined,
      lastSessionCompletedAt: (data.last_session_completed_at as string) ?? null,
      fromDate: data.from_date as string | null | undefined,
      untilDate: String(data.until_date),
      totalOralMl: Number(data.total_oral_ml ?? 0),
      totalIvMl: Number(data.total_iv_ml ?? 0),
      totalPrimeRinsebackMl: Number(data.total_prime_rinseback_ml ?? 0),
      totalOtherMl: Number(data.total_other_ml ?? 0),
      totalMl: Number(data.total_ml ?? 0),
      totalLiters: Number(data.total_liters ?? 0),
      dailyEntries: ((data.daily_entries as Record<string, unknown>[]) ?? []).map((day) => ({
        diaryDate: String(day.diary_date),
        notes: day.notes as string | undefined,
        intakes: ((day.intakes as Record<string, unknown>[]) ?? []).map((i) => ({
          id: String(i.id),
          category: String(i.category),
          description: i.description as string | undefined,
          volumeMl: i.volume_ml as number | null | undefined,
          volumeUnit: (i.volume_unit as string) || 'ml',
          displayVolume: i.display_volume as number | null | undefined,
          recordedTime: i.recorded_time as string | undefined,
        })),
      })),
    },
    potassium: {
      fromDate: (nutritionK?.from_date as string) ?? null,
      untilDate: String(nutritionK?.until_date ?? untilDate),
      lastSessionCompletedAt: (nutritionK?.last_session_completed_at as string) ?? null,
      newSessionDate: (nutritionK?.new_session_date as string) ?? undefined,
      totalPotassiumMg: Number(nutritionK?.total_potassium_mg ?? 0),
      dayCount: Number(nutritionK?.day_count ?? 0),
      dailyEntries: ((nutritionK?.daily_entries ?? []) as Record<string, unknown>[]).map((d) => ({
        diaryDate: String(d.diary_date ?? ''),
        totalPotassiumMg: Number(d.total_potassium_mg ?? 0),
      })),
      mealsInWindow: ((nutritionK?.meals_in_window ?? []) as Record<string, unknown>[]).map((m) => ({
        diaryDate: String(m.diary_date ?? ''),
        mealType: String(m.meal_type ?? ''),
        foodName: m.food_name as string | undefined,
        mealTakenAt: m.meal_taken_at as string | undefined,
        potassiumMg: Number(m.potassium_mg ?? 0),
      })),
    },
  };
}

export async function fetchFluidDiaries(patientId: string) {
  const data = await apiRequest(`/patients/${patientId}/fluid-diary`);
  return (data.diaries ?? []).map((d: Record<string, unknown>) => mapFluidDiary(d));
}

export async function saveFluidDiary(
  patientId: string,
  payload: {
    diary_date: string;
    notes?: string;
    intakes: import('@/types').RenalFluidIntakeInput[];
  }
) {
  const data = await apiRequest(`/patients/${patientId}/fluid-diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { diary: mapFluidDiary(data.diary) };
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

export async function fetchHealthHistory(
  patientId: string
): Promise<import('@/types').PatientHealthHistoryRecord> {
  return apiRequest(`/patients/${patientId}/health-history`);
}

export async function saveAllergyDiary(
  patientId: string,
  payload: {
    drug_allergies_none: boolean;
    drug_allergies_list?: string;
    food_env_allergies_none: boolean;
    food_env_allergies_list?: string;
    latex_contrast_reaction?: string | null;
    latex_contrast_details?: string;
  }
): Promise<Record<string, unknown>> {
  return apiRequest(`/patients/${patientId}/health-history/allergies`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function saveHealthHistory(
  patientId: string,
  payload: Record<string, unknown>
): Promise<import('@/types').PatientHealthHistoryRecord> {
  return apiRequest(`/patients/${patientId}/health-history`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function uploadHealthHistoryDocument(
  patientId: string,
  file: File
): Promise<import('@/types').HealthHistoryAttachment> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/patients/${patientId}/health-history/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Upload ${res.status}: ${message}`);
  }
  return res.json();
}

export async function deleteHealthHistoryAttachment(
  patientId: string,
  attachmentId: string
): Promise<void> {
  await apiRequest(`/patients/${patientId}/health-history/attachments/${attachmentId}`, {
    method: 'DELETE',
  });
}

export async function fetchCbpReports(patientId: string): Promise<import('@/types').CbpReportsResponse> {
  return apiRequest(`/patients/${patientId}/cbp-reports`);
}

export async function saveCbpReport(
  patientId: string,
  payload: Record<string, unknown>
): Promise<import('@/types').CbpReport> {
  return apiRequest(`/patients/${patientId}/cbp-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateCbpReport(
  patientId: string,
  reportId: string,
  payload: Record<string, unknown>
): Promise<import('@/types').CbpReport> {
  return apiRequest(`/patients/${patientId}/cbp-reports/${reportId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteCbpReport(patientId: string, reportId: string): Promise<void> {
  await apiRequest(`/patients/${patientId}/cbp-reports/${reportId}`, {
    method: 'DELETE',
  });
}

function mapVaccineDiary(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    patientId: String(raw.patient_id),
    diaryDate: String(raw.diary_date),
    notes: raw.notes as string | undefined,
    intakes: ((raw.intakes as Record<string, unknown>[]) ?? []).map((i) => ({
      id: String(i.id),
      vaccineName: String(i.vaccine_name ?? ''),
      doseText: i.dose_text as string | undefined,
      doseUnit: i.dose_unit as string | undefined,
      site: i.site as string | undefined,
      batchNumber: i.batch_number as string | undefined,
      administered: Boolean(i.administered),
      administeredAt: i.administered_at as string | undefined,
      notes: i.notes as string | undefined,
    })),
  };
}

export async function fetchVaccineDiaries(patientId: string) {
  const data = await apiRequest(`/patients/${patientId}/vaccine-diary`);
  return (data.diaries ?? []).map((d: Record<string, unknown>) => mapVaccineDiary(d));
}

export async function saveVaccineDiary(
  patientId: string,
  payload: {
    diary_date: string;
    notes?: string;
    intakes: import('@/types').VaccineDiaryIntakeInput[];
  }
) {
  const data = await apiRequest(`/patients/${patientId}/vaccine-diary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { diary: mapVaccineDiary(data.diary) };
}

export async function fetchInvestigationsCatalog() {
  return apiRequest('/patients/lab-investigations/catalog');
}

function mapLabInvestigation(raw: Record<string, unknown>) {
  return {
    id: String(raw.id),
    patientId: String(raw.patient_id),
    investigationType: String(raw.investigation_type),
    investigationLabel: String(raw.investigation_label ?? raw.investigation_type),
    reportDate: String(raw.report_date),
    labName: raw.lab_name as string | undefined,
    notes: raw.notes as string | undefined,
    results: (raw.results as Record<string, number | string>) ?? {},
  };
}

export async function fetchLabInvestigations(patientId: string, investigationType?: string) {
  const qs = investigationType ? `?investigation_type=${encodeURIComponent(investigationType)}` : '';
  const data = await apiRequest(`/patients/${patientId}/lab-investigations${qs}`);
  return {
    catalog: data.catalog,
    reports: (data.reports ?? []).map((r: Record<string, unknown>) => mapLabInvestigation(r)),
  };
}

export async function saveLabInvestigation(
  patientId: string,
  payload: {
    investigation_type: string;
    report_date: string;
    lab_name?: string;
    notes?: string;
    results?: Record<string, number | string>;
  }
) {
  return mapLabInvestigation(
    await apiRequest(`/patients/${patientId}/lab-investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateLabInvestigation(
  patientId: string,
  reportId: string,
  payload: Record<string, unknown>
) {
  return mapLabInvestigation(
    await apiRequest(`/patients/${patientId}/lab-investigations/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteLabInvestigation(patientId: string, reportId: string) {
  await apiRequest(`/patients/${patientId}/lab-investigations/${reportId}`, { method: 'DELETE' });
}
