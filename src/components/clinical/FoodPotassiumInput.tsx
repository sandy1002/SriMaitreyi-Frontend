import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as api from '@/services/api';
import type { FoodPotassiumItem } from '@/types';

type FoodPotassiumInputProps = {
  patientId?: string;
  foodItems: FoodPotassiumItem[];
  foodName: string;
  portionSize: string;
  potassium: string;
  onFoodNameChange: (value: string) => void;
  onPortionSizeChange: (value: string) => void;
  onPotassiumChange: (value: string) => void;
};

export function FoodPotassiumInput({
  patientId,
  foodItems,
  foodName,
  portionSize,
  potassium,
  onFoodNameChange,
  onPortionSizeChange,
  onPotassiumChange,
}: FoodPotassiumInputProps) {
  const [suggestions, setSuggestions] = useState<FoodPotassiumItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FoodPotassiumItem | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [listValue, setListValue] = useState('');

  const catalogItems = foodItems.filter((i) => !i.isCustom);
  const customItems = foodItems.filter((i) => i.isCustom);

  useEffect(() => {
    if (foodName.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .searchFoodPotassiumItems(foodName.trim(), undefined, patientId)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [foodName, patientId]);

  const applyFoodItem = (item: FoodPotassiumItem) => {
    setSelectedItem(item);
    setListValue(item.id);
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

  const handleListSelect = (itemId: string) => {
    setListValue(itemId);
    const item = foodItems.find((f) => f.id === itemId);
    if (item) applyFoodItem(item);
  };

  return (
    <div className="space-y-2 sm:col-span-2">
      <div className="space-y-2">
        <Label>Food from saved list</Label>
        <Select value={listValue} onValueChange={handleListSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a food…" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {customItems.length > 0 && (
              <SelectGroup>
                <SelectLabel>Your foods</SelectLabel>
                {customItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} — {item.potassiumMgPerServing} mg K
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {catalogItems.length > 0 && (
              <SelectGroup>
                <SelectLabel>Reference foods</SelectLabel>
                {catalogItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} — {item.potassiumMgPerServing} mg K
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Food name</Label>
        <Input
          value={foodName}
          onChange={(e) => {
            setSelectedItem(null);
            setListValue('');
            onFoodNameChange(e.target.value);
          }}
          placeholder="Or type / search another food…"
        />
      </div>

      {suggestions.length > 0 && foodName.trim().length >= 2 && (
        <ul className="border rounded-md text-sm max-h-32 overflow-auto bg-popover shadow-sm">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted"
                onClick={() => applyFoodItem(item)}
              >
                <span className="font-medium">{item.name}</span>
                {item.isCustom && <span className="text-xs text-primary ml-1">(your food)</span>}
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
              setListValue('');
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
    </div>
  );
}
