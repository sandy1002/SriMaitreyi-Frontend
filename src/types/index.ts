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
  recorded_time?: string;
}

export interface PatientTrendsResponse {
  patientId: string;
  patientName: string;
  weightTrend: WeightTrendPoint[];
  recentAlerts: ClinicalAlert[];
  propertyGraph: PropertyGraphTrends;
}
