import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { FoodPotassiumItem } from '@/types';

type FoodPotassiumInputProps = {
  patientId?: string;
  foodName: string;
  portionSize: string;
  potassium: string;
  onFoodNameChange: (value: string) => void;
  onPortionSizeChange: (value: string) => void;
  onPotassiumChange: (value: string) => void;
  category?: string;
};

export function FoodPotassiumInput({
  patientId,
  foodName,
  portionSize,
  potassium,
  onFoodNameChange,
  onPortionSizeChange,
  onPotassiumChange,
  category,
}: FoodPotassiumInputProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<FoodPotassiumItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FoodPotassiumItem | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (foodName.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .searchFoodPotassiumItems(foodName.trim(), category, patientId)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [foodName, category, patientId]);

  const applyFoodItem = (item: FoodPotassiumItem) => {
    setSelectedItem(item);
    onFoodNameChange(item.name);
    setSuggestions([]);
    if (!portionSize.trim()) {
      onPortionSizeChange(item.servingDescription);
    }
    recalcK(item.id, portionSize || item.servingDescription);
  };

  const recalcK = async (foodItemId: string, portion: string) => {
    setCalculating(true);
    try {
      const result = await api.calculateFoodPotassium({
        foodItemId,
        portionSize: portion,
        servings: 1,
        patientId,
      });
      onPotassiumChange(String(result.potassiumMg));
    } catch {
      /* manual entry still allowed */
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    if (!selectedItem) return;
    const t = setTimeout(() => {
      recalcK(selectedItem.id, portionSize || selectedItem.servingDescription);
    }, 500);
    return () => clearTimeout(t);
  }, [portionSize, selectedItem?.id]);

  const canSaveCustom =
    patientId &&
    foodName.trim().length >= 2 &&
    potassium.trim() !== '' &&
    Number.isFinite(Number(potassium)) &&
    !selectedItem;

  const handleSaveCustomFood = async () => {
    if (!patientId || !canSaveCustom) return;
    setSaving(true);
    try {
      const item = await api.createCustomFoodPotassiumItem({
        patientId,
        name: foodName.trim(),
        potassiumMgPerServing: Number(potassium),
        servingDescription: portionSize.trim() || '1 serving',
      });
      setSelectedItem(item);
      toast({
        title: 'Food saved',
        description: `${item.name} is now in your food list for quick lookup.`,
      });
    } catch {
      toast({ title: 'Could not save food', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Food name</Label>
      <Input
        value={foodName}
        onChange={(e) => {
          setSelectedItem(null);
          onFoodNameChange(e.target.value);
        }}
        placeholder="Search food items or type your own…"
      />
      {suggestions.length > 0 && (
        <ul className="border rounded-md text-sm max-h-36 overflow-auto bg-popover shadow-sm">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted"
                onClick={() => applyFoodItem(item)}
              >
                <span className="font-medium">{item.name}</span>
                {item.isCustom && (
                  <span className="text-xs text-primary ml-1">(your food)</span>
                )}
                <span className="text-muted-foreground ml-2">
                  {item.potassiumMgPerServing} mg K / {item.servingDescription}
                </span>
                <span className="text-muted-foreground ml-1 text-xs capitalize">
                  ({item.category.replace(/_/g, ' ')})
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Portion size</Label>
          <Input
            value={portionSize}
            onChange={(e) => onPortionSizeChange(e.target.value)}
            placeholder="e.g. 1 cup / 1 idli / 150 g"
          />
        </div>
        <div>
          <Label>Potassium (mg) {calculating ? '— calculating…' : ''}</Label>
          <Input
            type="number"
            value={potassium}
            onChange={(e) => {
              setSelectedItem(null);
              onPotassiumChange(e.target.value);
            }}
            placeholder="Enter or auto-fill from food list"
          />
          {selectedItem && (
            <p className="text-xs text-muted-foreground mt-1">
              From {selectedItem.name} ({selectedItem.servingDescription})
            </p>
          )}
        </div>
      </div>
      {canSaveCustom && (
        <div className="rounded-md border border-dashed p-3 space-y-2 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Not in the list? Save this food with its potassium value — it will appear in search next
            time.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveCustomFood}
            disabled={saving}
          >
            <Plus className="h-4 w-4 mr-1" />
            {saving ? 'Saving…' : 'Save to my food list'}
          </Button>
        </div>
      )}
    </div>
  );
}
