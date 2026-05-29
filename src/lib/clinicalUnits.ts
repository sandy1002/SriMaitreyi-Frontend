import type { PreDialysisAssessment } from '@/types';

export const FLUID_VOLUME_UNITS = ['ml', 'L'] as const;
export type FluidVolumeUnit = (typeof FLUID_VOLUME_UNITS)[number];

export const DOSE_UNITS = ['mg', 'mcg', 'g', 'IU', 'tablet', 'ml', 'units'] as const;

export function formatUfGoal(assessment?: PreDialysisAssessment | null): string {
  if (!assessment) return '—';
  if (assessment.ufGoalLiters != null) return `${assessment.ufGoalLiters} L`;
  if (assessment.ufGoal?.trim()) return assessment.ufGoal.trim();
  if (assessment.idwgKg != null && assessment.fluidAddedLiters != null) {
    return `${(assessment.idwgKg + assessment.fluidAddedLiters).toFixed(2)} L`;
  }
  return '—';
}

/** Format stored ml using the row's display unit. */
export function formatVolumeFromMl(ml?: number | null, unit?: string): string {
  if (ml == null) return '—';
  const u = (unit || 'ml').toLowerCase();
  if (u === 'l') return `${(ml / 1000).toFixed(2)} L`;
  return `${Math.round(ml)} ml`;
}

export function volumeInputFromMl(ml?: number | null, unit?: string): string {
  if (ml == null) return '';
  const u = (unit || 'ml').toLowerCase();
  if (u === 'l') return String(ml / 1000);
  return String(ml);
}

export function volumeToMl(value: number, unit: string): number {
  return unit.toLowerCase() === 'l' ? value * 1000 : value;
}

export function formatDose(doseText?: string, doseUnit?: string): string {
  if (!doseText?.trim()) return '—';
  if (doseUnit?.trim()) return `${doseText.trim()} ${doseUnit.trim()}`;
  return doseText.trim();
}
