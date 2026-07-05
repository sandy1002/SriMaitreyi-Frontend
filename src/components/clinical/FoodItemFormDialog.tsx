import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCustomFoodPotassiumItem, updateFoodPotassiumItem } from '@/services/api';
import type { FoodPotassiumItem } from '@/types';

type FoodItemFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  food?: FoodPotassiumItem | null;
  editGlobal?: boolean;
  onSaved: (item: FoodPotassiumItem) => void;
};

export function FoodItemFormDialog({
  open,
  onOpenChange,
  patientId,
  food,
  editGlobal = false,
  onSaved,
}: FoodItemFormDialogProps) {
  const isEdit = !!food;
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [servingDescription, setServingDescription] = useState('100 g');
  const [servingGrams, setServingGrams] = useState('100');
  const [potassium, setPotassium] = useState('');
  const [protein, setProtein] = useState('');
  const [kcal, setKcal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (food) {
      setName(food.name);
      setServingDescription(food.servingDescription || '100 g');
      setServingGrams(String(food.servingGrams ?? 100));
      setPotassium(String(food.potassiumMgPerServing ?? ''));
      setProtein(food.proteinGPerServing != null ? String(food.proteinGPerServing) : '');
      setKcal(food.kcalPerServing != null ? String(food.kcalPerServing) : '');
    } else {
      setName('');
      setServingDescription('100 g');
      setServingGrams('100');
      setPotassium('');
      setProtein('');
      setKcal('');
    }
  }, [open, food]);

  const nutrientLabel =
    servingGrams === '100' ? 'per 100 g' : `per serving (${servingDescription || 'as listed'})`;

  const handleSave = async () => {
    if (!name.trim() || potassium.trim() === '' || !Number.isFinite(Number(potassium))) {
      toast({ title: 'Enter food name and potassium', variant: 'destructive' });
      return;
    }
    if (kcal.trim() === '' || !Number.isFinite(Number(kcal))) {
      toast({ title: 'Enter calories (kcal)', variant: 'destructive' });
      return;
    }
    const grams = servingGrams.trim() !== '' ? Number(servingGrams) : 100;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        potassiumMgPerServing: Number(potassium),
        proteinGPerServing: protein.trim() !== '' ? Number(protein) : undefined,
        kcalPerServing: Number(kcal),
        servingDescription: servingDescription.trim() || '100 g',
        servingGrams: grams,
      };
      const item = isEdit
        ? await updateFoodPotassiumItem(food!.id, {
            patientId,
            editGlobal,
            ...payload,
          })
        : await createCustomFoodPotassiumItem({
            patientId,
            ...payload,
          });
      onSaved(item);
      toast({
        title: isEdit ? 'Food updated' : 'Food saved',
        description: isEdit
          ? editGlobal || food?.isCustom
            ? `${item.name} values updated.`
            : `${item.name} saved as your personal copy.`
          : `${item.name} added to your food list.`,
      });
      onOpenChange(false);
    } catch {
      toast({ title: isEdit ? 'Update failed' : 'Could not save food', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit food' : 'Add food'}</DialogTitle>
          <DialogDescription>
            {isEdit && !food?.isCustom && !editGlobal
              ? 'Reference foods are copied to your personal list when edited, so the shared catalog stays unchanged.'
              : isEdit && editGlobal
                ? 'Changes apply to the global food catalog for all patients.'
                : 'Enter nutrients for the serving size below. Use 100 g for the standard catalog format.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="food-name">Food name</Label>
            <Input
              id="food-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Homemade dal"
              disabled={isEdit && !food?.isCustom && !editGlobal}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="food-serving">Serving description</Label>
              <Input
                id="food-serving"
                value={servingDescription}
                onChange={(e) => setServingDescription(e.target.value)}
                placeholder="100 g"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="food-grams">Serving weight (g)</Label>
              <Input
                id="food-grams"
                type="number"
                min={1}
                value={servingGrams}
                onChange={(e) => setServingGrams(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="food-k">Potassium (mg {nutrientLabel})</Label>
            <Input
              id="food-k"
              type="number"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="food-protein">Protein (g {nutrientLabel})</Label>
            <Input
              id="food-protein"
              type="number"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="food-kcal">Calories (kcal {nutrientLabel})</Label>
            <Input
              id="food-kcal"
              type="number"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Save food'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
