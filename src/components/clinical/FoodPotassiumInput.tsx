import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as api from '@/services/api';
import type { FoodPotassiumItem } from '@/types';

type FoodPotassiumInputProps = {
  foodName: string;
  portionSize: string;
  potassium: string;
  onFoodNameChange: (value: string) => void;
  onPortionSizeChange: (value: string) => void;
  onPotassiumChange: (value: string) => void;
  category?: 'fruit' | 'vegetable';
};

export function FoodPotassiumInput({
  foodName,
  portionSize,
  potassium,
  onFoodNameChange,
  onPortionSizeChange,
  onPotassiumChange,
  category,
}: FoodPotassiumInputProps) {
  const [suggestions, setSuggestions] = useState<FoodPotassiumItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FoodPotassiumItem | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (foodName.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      api.searchFoodPotassiumItems(foodName.trim(), category).then(setSuggestions).catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [foodName, category]);

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

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Food name</Label>
      <Input
        value={foodName}
        onChange={(e) => {
          setSelectedItem(null);
          onFoodNameChange(e.target.value);
        }}
        placeholder="Search fruits & vegetables…"
        list="food-potassium-suggestions"
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
                <span className="text-muted-foreground ml-2">
                  {item.potassiumMgPerServing} mg K / {item.servingDescription}
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
            placeholder="e.g. 1 cup / 150 g"
          />
        </div>
        <div>
          <Label>Potassium (mg) {calculating ? '— calculating…' : ''}</Label>
          <Input
            type="number"
            value={potassium}
            onChange={(e) => onPotassiumChange(e.target.value)}
          />
          {selectedItem && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto-calculated from {selectedItem.name} reference ({selectedItem.servingDescription})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
