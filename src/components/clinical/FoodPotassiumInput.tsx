import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import * as api from '@/services/api';
import type { FoodPotassiumItem } from '@/types';

export type MealFoodSelection = {
  key: string;
  foodItemId?: string;
  name: string;
  portionSize: string;
  potassiumMg: number;
  proteinG: number;
  kcal: number;
};

type FoodPotassiumInputProps = {
  patientId?: string;
  foodItems: FoodPotassiumItem[];
  selectedFoods: MealFoodSelection[];
  onSelectedFoodsChange: (foods: MealFoodSelection[]) => void;
};

function newSelectionKey() {
  return `food-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type NutrientCalc = {
  potassiumMg: number;
  proteinG: number | null;
  kcal: number | null;
};

export function FoodPotassiumInput({
  patientId,
  foodItems,
  selectedFoods,
  onSelectedFoodsChange,
}: FoodPotassiumInputProps) {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodPotassiumItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [calculatingKey, setCalculatingKey] = useState<string | null>(null);

  const customItems = useMemo(() => foodItems.filter((i) => i.isCustom), [foodItems]);
  const catalogItems = useMemo(() => foodItems.filter((i) => !i.isCustom), [foodItems]);

  const displayItems = useMemo(() => {
    const merged = new Map<string, FoodPotassiumItem>();
    for (const item of foodItems) merged.set(item.id, item);
    for (const item of searchResults) merged.set(item.id, item);
    return Array.from(merged.values());
  }, [foodItems, searchResults]);

  const useServerSearch = searchQuery.trim().length >= 2;
  const itemsToShow = useServerSearch ? displayItems : foodItems;
  const filteredCustom = useMemo(
    () => itemsToShow.filter((i) => i.isCustom),
    [itemsToShow]
  );
  const filteredCatalog = useMemo(
    () => itemsToShow.filter((i) => !i.isCustom),
    [itemsToShow]
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .searchFoodPotassiumItems(searchQuery.trim(), undefined, patientId)
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, patientId]);

  const totalPotassium = selectedFoods.reduce((sum, f) => sum + (f.potassiumMg || 0), 0);
  const totalProtein = selectedFoods.reduce((sum, f) => sum + (f.proteinG || 0), 0);
  const totalKcal = selectedFoods.reduce((sum, f) => sum + (f.kcal || 0), 0);

  const recalcNutrientsForEntry = async (entry: MealFoodSelection): Promise<NutrientCalc | null> => {
    if (!entry.foodItemId) return null;
    try {
      const result = await api.calculateFoodPotassium({
        foodItemId: entry.foodItemId,
        portionSize: entry.portionSize,
        servings: 1,
        patientId,
      });
      return {
        potassiumMg: result.potassiumMg,
        proteinG: result.proteinG,
        kcal: result.kcal,
      };
    } catch {
      return null;
    }
  };

  const applyNutrients = (
    foods: MealFoodSelection[],
    key: string,
    nutrients: NutrientCalc
  ): MealFoodSelection[] =>
    foods.map((f) =>
      f.key === key
        ? {
            ...f,
            potassiumMg: nutrients.potassiumMg,
            proteinG: nutrients.proteinG ?? f.proteinG,
            kcal: nutrients.kcal ?? f.kcal,
          }
        : f
    );

  const addFoodItem = async (item: FoodPotassiumItem) => {
    const portion = item.servingDescription || '1 serving';
    const entry: MealFoodSelection = {
      key: newSelectionKey(),
      foodItemId: item.id,
      name: item.name,
      portionSize: portion,
      potassiumMg: item.potassiumMgPerServing,
      proteinG: item.proteinGPerServing ?? 0,
      kcal: item.kcalPerServing ?? 0,
    };
    const next = [...selectedFoods, entry];
    onSelectedFoodsChange(next);
    setOpen(true);
    setCalculatingKey(entry.key);
    const nutrients = await recalcNutrientsForEntry(entry);
    if (nutrients !== null) {
      onSelectedFoodsChange(applyNutrients(next, entry.key, nutrients));
    }
    setCalculatingKey(null);
  };

  const updateEntry = async (key: string, patch: Partial<MealFoodSelection>) => {
    const next = selectedFoods.map((f) => (f.key === key ? { ...f, ...patch } : f));
    onSelectedFoodsChange(next);
    if (patch.portionSize === undefined) return;
    const updated = next.find((f) => f.key === key);
    if (!updated?.foodItemId) return;
    setCalculatingKey(key);
    const nutrients = await recalcNutrientsForEntry(updated);
    if (nutrients !== null) {
      onSelectedFoodsChange(applyNutrients(next, key, nutrients));
    }
    setCalculatingKey(null);
  };

  const removeEntry = (key: string) => {
    onSelectedFoodsChange(selectedFoods.filter((f) => f.key !== key));
  };

  const isInList = (itemId: string) =>
    selectedFoods.some((f) => f.foodItemId === itemId);

  const renderFoodOption = (item: FoodPotassiumItem) => (
    <CommandItem
      key={item.id}
      value={`${item.name} ${item.servingDescription} ${item.category}`}
      onSelect={() => addFoodItem(item)}
    >
      <Check
        className={cn('mr-2 h-4 w-4 shrink-0', isInList(item.id) ? 'opacity-100' : 'opacity-0')}
      />
      <span className="flex-1 truncate">
        <span className="font-medium">{item.name}</span>
        {item.isCustom && <span className="text-xs text-primary ml-1">(yours)</span>}
        <span className="text-muted-foreground ml-2 text-xs">
          {item.potassiumMgPerServing} mg K
          {item.proteinGPerServing != null ? ` · ${item.proteinGPerServing} g protein` : ''}
          {item.kcalPer100g != null
            ? ` · ${Math.round(item.kcalPer100g)} kcal/100g`
            : item.kcalPerServing != null
              ? ` · ${item.kcalPerServing} kcal`
              : ''}
          {' / '}
          {item.servingDescription}
        </span>
      </span>
    </CommandItem>
  );

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="space-y-2">
        <Label>Foods (search &amp; multi-select)</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              {selectedFoods.length === 0
                ? 'Search and add foods…'
                : `${selectedFoods.length} food${selectedFoods.length === 1 ? '' : 's'} added`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(100vw-2rem,28rem)] p-0" align="start">
            <Command shouldFilter={!useServerSearch} onValueChange={setSearchQuery}>
              <CommandInput placeholder="Search foods…" />
              <CommandList>
                <CommandEmpty>No food found.</CommandEmpty>
                {filteredCustom.length > 0 && (
                  <CommandGroup heading="Your foods">
                    {filteredCustom.map(renderFoodOption)}
                  </CommandGroup>
                )}
                {filteredCatalog.length > 0 && (
                  <CommandGroup heading="Reference foods">
                    {filteredCatalog.map(renderFoodOption)}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Select multiple foods — potassium, protein, and kcal auto-calculate from portion size (kcal shown per 100 g).
        </p>
      </div>

      {selectedFoods.length > 0 && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
          {selectedFoods.map((food) => (
            <div
              key={food.key}
              className="grid gap-2 rounded-md border bg-background p-3 sm:grid-cols-[1fr_auto_auto]"
            >
              <div className="space-y-2 sm:col-span-3 sm:grid sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Food</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-normal">
                      {food.name}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Portion</Label>
                  <Input
                    className="mt-1 h-8"
                    value={food.portionSize}
                    onChange={(e) => updateEntry(food.key, { portionSize: e.target.value })}
                    placeholder="e.g. 1 cup"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeEntry(food.key)}
                    aria-label={`Remove ${food.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:col-span-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    K (mg){calculatingKey === food.key ? ' …' : ''}
                  </Label>
                  <Input
                    className="mt-1 h-8"
                    type="number"
                    value={food.potassiumMg || ''}
                    onChange={(e) =>
                      updateEntry(food.key, {
                        potassiumMg: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                  <Input
                    className="mt-1 h-8"
                    type="number"
                    value={food.proteinG || ''}
                    onChange={(e) =>
                      updateEntry(food.key, {
                        proteinG: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Kcal</Label>
                  <Input
                    className="mt-1 h-8"
                    type="number"
                    value={food.kcal || ''}
                    onChange={(e) =>
                      updateEntry(food.key, {
                        kcal: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm font-medium pt-1">
            <span>Meal K: {Math.round(totalPotassium * 10) / 10} mg</span>
            <span>Protein: {Math.round(totalProtein * 10) / 10} g</span>
            <span>Kcal: {Math.round(totalKcal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
