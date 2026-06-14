import { useState } from 'react';
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
import { createCustomFoodPotassiumItem } from '@/services/api';
import type { FoodPotassiumItem } from '@/types';

type CustomFoodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  onSaved: (item: FoodPotassiumItem) => void;
};

export function CustomFoodDialog({
  open,
  onOpenChange,
  patientId,
  onSaved,
}: CustomFoodDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [portion, setPortion] = useState('1 serving');
  const [potassium, setPotassium] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName('');
    setPortion('1 serving');
    setPotassium('');
  };

  const handleSave = async () => {
    if (!name.trim() || potassium.trim() === '' || !Number.isFinite(Number(potassium))) {
      toast({ title: 'Enter food name and potassium (mg)', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const item = await createCustomFoodPotassiumItem({
        patientId,
        name: name.trim(),
        potassiumMgPerServing: Number(potassium),
        servingDescription: portion.trim() || '1 serving',
      });
      onSaved(item);
      toast({ title: 'Food saved', description: `${item.name} added to your food list.` });
      reset();
      onOpenChange(false);
    } catch {
      toast({ title: 'Could not save food', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add food & potassium</DialogTitle>
          <DialogDescription>
            Save a food that is not in the list yet. It will appear in the food dropdown for future
            meals.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="custom-food-name">Food name</Label>
            <Input
              id="custom-food-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Homemade dal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-food-portion">Portion / serving</Label>
            <Input
              id="custom-food-portion"
              value={portion}
              onChange={(e) => setPortion(e.target.value)}
              placeholder="e.g. 1 cup / 1 bowl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-food-k">Potassium (mg per serving)</Label>
            <Input
              id="custom-food-k"
              type="number"
              value={potassium}
              onChange={(e) => setPotassium(e.target.value)}
              placeholder="e.g. 250"
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
            ) : (
              'Save food'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
