export interface Patient {
  id: string;
  name: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other' | string;
  medicalRecordNumber: string;
  targetDryWeightKg?: number | null;
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

export type UserRole = 'patient' | 'admin' | 'technician' | 'doctor' | 'nutrition';

export type StaffRole = 'technician' | 'doctor' | 'nutrition';

export const REPORT_DAY_OPTIONS = [5, 7, 15, 30] as const;
export type ReportDayRange = (typeof REPORT_DAY_OPTIONS)[number];

export interface PreDialysisAssessment {
  weightKg?: number | null;
  bloodPressure?: string;
  pulse?: number | null;
  temperature?: number | null;
  bloodSugar?: number | null;
  accessCondition?: string;
  ufGoal?: string;
  potassiumMmolL?: number | null;
  targetDryWeightKg?: number | null;
  primeRinsebackMl?: number | null;
  ivFluidsMl?: number | null;
  oralIntakeMl?: number | null;
  idwgKg?: number | null;
  fluidAddedLiters?: number | null;
  ufGoalLiters?: number | null;
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
  intervalMinutes?: number;
  sessionStartedAt?: string;
  currentTime?: string;
  readings: SessionVitalReading[];
  slots?: VitalsWorkflowSlot[];
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
  postPotassiumMmolL?: number | null;
  postBloodSugar?: number | null;
}

export interface SessionMedicationIntake {
  id: string;
  sessionId: string;
  medicineId?: string | null;
  medicineName?: string | null;
  doseText?: string;
  doseUnit?: string;
  route?: string;
  takenAt?: string;
  notes?: string;
  createdAt?: string;
}

export interface UfGoalCalculation {
  idwgKg: number;
  fluidAddedLiters: number;
  ufGoalLiters: number;
  ufGoal: string;
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
  status: 'in-progress' | 'post-dialysis' | 'completed';
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

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  unit?: string;
  description?: string;
  active?: boolean;
}

export interface MealNutrient {
  id?: string;
  nutrientCode: string;
  amount?: number | null;
  unit: string;
}

export interface NutritionMeal {
  id?: string;
  mealType: string;
  foodName?: string;
  portionSize?: string;
  foodDescription?: string;
  nutritionFacts?: Record<string, unknown>;
  medicalDetails?: Record<string, unknown>;
  nutrients?: MealNutrient[];
}

export interface NutritionAlert {
  id: string;
  patientId: string;
  diaryId: string;
  severity: string;
  code: string;
  message: string;
  evidence?: Record<string, unknown>;
}

export interface NutritionDiaryEntry {
  id: string;
  patientId: string;
  diaryDate: string;
  notesEndOfDay?: string;
  medicineDiary?: string;
  totalProteinG?: number | null;
  totalSodiumMg?: number | null;
  totalPhosphorusMg?: number | null;
  totalPotassiumMg?: number | null;
  meals: NutritionMeal[];
  alerts?: NutritionAlert[];
}

export interface NutritionMealInput {
  meal_type: string;
  food_name?: string;
  portion_size?: string;
  food_description?: string;
  nutrition_facts?: Record<string, unknown>;
  medical_details?: Record<string, unknown>;
  nutrients: { nutrient_code: string; amount?: number; unit: string }[];
}

export interface MedicationDiaryIntake {
  id?: string;
  medicineId?: string | null;
  medicineName?: string;
  doseText?: string;
  doseUnit?: string;
  route?: string;
  taken: boolean;
  takenTime?: string;
  notes?: string;
}

export interface MedicationDiaryEntry {
  id: string;
  patientId: string;
  diaryDate: string;
  notes?: string;
  totalDoses?: number | null;
  intakes: MedicationDiaryIntake[];
}

export interface MedicationDiaryIntakeInput {
  medicine_id?: string;
  medicine_name?: string;
  dose_text?: string;
  dose_unit?: string;
  route?: string;
  taken: boolean;
  taken_time?: string;
  notes?: string;
}

export interface RenalFluidIntakeLine {
  id?: string;
  category: string;
  description?: string;
  volumeMl?: number | null;
  volumeUnit?: string;
  displayVolume?: number | null;
  recordedTime?: string;
}

export interface RenalFluidDiaryEntry {
  id: string;
  patientId: string;
  diaryDate: string;
  notes?: string;
  totalOralMl?: number | null;
  totalIvMl?: number | null;
  totalPrimeRinsebackMl?: number | null;
  totalOtherMl?: number | null;
  intakes: RenalFluidIntakeLine[];
}

export interface RenalFluidIntakeInput {
  category: string;
  description?: string;
  volume_ml?: number;
  volume_unit?: string;
  recorded_time?: string;
}

export interface InterdialyticFluidsSummary {
  lastSessionId?: string | null;
  lastSessionDate?: string | null;
  fromDate?: string | null;
  untilDate: string;
  totalOralMl: number;
  totalIvMl: number;
  totalPrimeRinsebackMl: number;
  totalOtherMl: number;
  totalMl: number;
  totalLiters: number;
  dailyEntries: {
    diaryDate: string;
    notes?: string;
    intakes: RenalFluidIntakeLine[];
  }[];
}

export interface PatientTrendsResponse {
  patientId: string;
  patientName: string;
  weightTrend: WeightTrendPoint[];
  recentAlerts: ClinicalAlert[];
  propertyGraph: PropertyGraphTrends;
}

export interface HealthHistoryOption {
  code: string;
  label: string;
}

export interface HealthHistorySurgery {
  id?: string;
  approx_date?: string;
  reason?: string;
  complications_notes?: string;
}

export interface HealthHistoryFamilyRow {
  id?: string;
  condition: string;
  affected_relatives?: string;
  notes_age_at_diagnosis?: string;
}

export interface HealthHistoryMedicationRow {
  id?: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
}

export interface HealthHistoryAttachment {
  id: string;
  patient_id: string;
  file_name: string;
  file_type?: string;
  file_url: string;
  uploaded_at?: string;
}

export interface PatientHealthHistoryRecord {
  exists: boolean;
  id?: string;
  patient_id?: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship_phone?: string;
  chief_complaint?: string;
  chronic_conditions?: string[];
  chronic_condition_labels?: string[];
  other_diagnoses?: string;
  drug_allergies_none?: boolean;
  drug_allergies_list?: string;
  food_env_allergies_none?: boolean;
  food_env_allergies_list?: string;
  latex_contrast_reaction?: string;
  latex_contrast_details?: string;
  tobacco_status?: string;
  tobacco_quit_date?: string;
  tobacco_packs_per_day?: string;
  alcohol_status?: string;
  alcohol_drinks_per_week?: string;
  recreational_drugs_never?: boolean;
  recreational_drugs_yes?: boolean;
  recreational_drugs_details?: string;
  occupation?: string;
  completed_at?: string;
  surgeries?: HealthHistorySurgery[];
  family_rows?: HealthHistoryFamilyRow[];
  medications?: HealthHistoryMedicationRow[];
  form_options?: {
    chronic_conditions: HealthHistoryOption[];
    family_conditions: HealthHistoryOption[];
  };
  attachments?: HealthHistoryAttachment[];
}

export type CbpFieldStatus = 'normal' | 'low' | 'high' | 'unknown' | null;

export interface CbpFieldFlag {
  value?: number | null;
  unit: string;
  label: string;
  reference_range: string;
  status: CbpFieldStatus;
}

export interface CbpReport {
  id: string;
  patient_id: string;
  report_date: string;
  lab_name?: string;
  notes?: string;
  hemoglobin?: number | null;
  pcv_hematocrit?: number | null;
  total_rbc_count?: number | null;
  mcv?: number | null;
  mch?: number | null;
  mchc?: number | null;
  rdw_cv?: number | null;
  total_wbc_count?: number | null;
  neutrophils_pct?: number | null;
  lymphocytes_pct?: number | null;
  eosinophils_pct?: number | null;
  monocytes_pct?: number | null;
  basophils_pct?: number | null;
  total_platelet_count?: number | null;
  mpv?: number | null;
  rbc_morphology?: string;
  wbc_morphology?: string;
  platelets_on_smear?: string;
  parasites_seen?: boolean;
  parasites_details?: string;
  pre_urea?: number | null;
  post_urea?: number | null;
  parathyroid_hormone?: number | null;
  creatinine?: number | null;
  phosphorus?: number | null;
  serum_calcium?: number | null;
  serum_potassium?: number | null;
  albumin?: number | null;
  field_flags?: Record<string, CbpFieldFlag>;
  abnormal_count?: number;
  abnormal_fields?: string[];
  created_at?: string;
}

export interface CbpReportsResponse {
  reference: {
    sections: { id: string; title: string }[];
    fields: {
      key: string;
      label: string;
      unit: string;
      section: string;
      reference_range?: string;
    }[];
  };
  patient_gender?: string;
  reports: CbpReport[];
}
