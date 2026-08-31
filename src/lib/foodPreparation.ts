import type { FoodPreparation } from '@/types';

const LABELS: Record<FoodPreparation, string> = {
  cooked: 'Cooked',
  ready_to_eat: 'Ready to eat',
};

export function preparationLabel(
  preparation?: FoodPreparation | string | null
): string | null {
  if (!preparation) return null;
  return LABELS[preparation as FoodPreparation] ?? null;
}
