import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, CircleHelp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  /** Portion count multiplier (1 = one catalog serving). */
  quantity: string;
  potassiumMg: number;
  proteinG: number;
  kcal: number;
  sodiumMg: number;
  phosphorusMg: number;
};

/** Parse saved portion text back to a numeric quantity. */
export function parsePortionQuantity(portion: string | undefined): string {
  if (!portion?.trim()) return '1';
  const t = portion.trim();
  const bare = t.match(/^([\d.]+)$/);
  if (bare) return bare[1];
  const mult = t.match(/^([\d.]+)\s*[×x]/i);
  if (mult) return mult[1];
  return '1';
}

export function formatPortionSizeForSave(quantity: string, servingDescription?: string): string {
  const q = quantity.trim() || '1';
  if (servingDescription?.trim()) return `${q}× ${servingDescription.trim()}`;
  return q;
}

function servingTooltipText(item: FoodPotassiumItem | undefined): string {
  if (!item) {
    return '1 portion = one catalog serving. Enter a number to multiply (e.g. 2 = double).';
  }
  const lines = [`1 portion = ${item.servingDescription}`];
  if (item.servingGrams) lines.push(`Weight: ${item.servingGrams} g`);
  const nutrients: string[] = [];
  if (item.potassiumMgPerServing != null) nutrients.push(`${item.potassiumMgPerServing} mg K`);
  if (item.proteinGPerServing != null) nutrients.push(`${item.proteinGPerServing} g protein`);
  if (item.kcalPerServing != null) nutrients.push(`${item.kcalPerServing} kcal`);
  if (item.sodiumMgPerServing != null) nutrients.push(`${item.sodiumMgPerServing} mg Na`);
  if (item.phosphorusMgPerServing != null) nutrients.push(`${item.phosphorusMgPerServing} mg P`);
  if (nutrients.length) lines.push(`Per portion: ${nutrients.join(' · ')}`);
  lines.push('Qty 2 = twice this portion, 0.5 = half.');
  return lines.join('\n');
}

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
  sodiumMg: number | null;
  phosphorusMg: number | null;
};

function quantityMultiplier(quantity: string): number {
  const n = parseFloat(quantity.trim());
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(n, 20);
}

function resolveFoodMeta(
  entry: MealFoodSelection,
  foodMetaById: Map<string, FoodPotassiumItem>,
  foodItems: FoodPotassiumItem[]
): FoodPotassiumItem | undefined {
  if (entry.foodItemId) return foodMetaById.get(entry.foodItemId);
  const name = entry.name.trim().toLowerCase();
  if (!name) return undefined;
  return foodItems.find((f) => f.name.toLowerCase() === name);
}

/** Scale catalog per-serving nutrients by numeric quantity (works offline if API is down). */
function calcNutrientsFromCatalog(item: FoodPotassiumItem, quantity: string): NutrientCalc {
  const mult = quantityMultiplier(quantity);
  return {
    potassiumMg: Math.round(item.potassiumMgPerServing * mult * 10) / 10,
    proteinG:
      item.proteinGPerServing != null
        ? Math.round(item.proteinGPerServing * mult * 10) / 10
        : null,
    kcal:
      item.kcalPerServing != null ? Math.round(item.kcalPerServing * mult) : null,
    sodiumMg:
      item.sodiumMgPerServing != null
        ? Math.round(item.sodiumMgPerServing * mult * 10) / 10
        : null,
    phosphorusMg:
      item.phosphorusMgPerServing != null
        ? Math.round(item.phosphorusMgPerServing * mult * 10) / 10
        : null,
  };
}

export function FoodPotassiumInput({
  patientId,
  foodItems,
  selectedFoods,
  onSelectedFoodsChange,
}: FoodPotassiumInputProps) {
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodPotassiumItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const foodMetaById = useMemo(() => {
    const map = new Map<string, FoodPotassiumItem>();
    for (const item of foodItems) map.set(item.id, item);
    for (const item of searchResults) map.set(item.id, item);
    return map;
  }, [foodItems, searchResults]);

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
  const totalSodium = selectedFoods.reduce((sum, f) => sum + (f.sodiumMg || 0), 0);
  const totalPhosphorus = selectedFoods.reduce((sum, f) => sum + (f.phosphorusMg || 0), 0);

  const recalcEntrySync = (entry: MealFoodSelection): MealFoodSelection => {
    const meta = resolveFoodMeta(entry, foodMetaById, foodItems);
    if (!meta) return entry;
    const nutrients = calcNutrientsFromCatalog(meta, entry.quantity || '1');
    return {
      ...entry,
      foodItemId: entry.foodItemId ?? meta.id,
      potassiumMg: nutrients.potassiumMg,
      proteinG: nutrients.proteinG ?? 0,
      kcal: nutrients.kcal ?? 0,
      sodiumMg: nutrients.sodiumMg ?? 0,
      phosphorusMg: nutrients.phosphorusMg ?? 0,
    };
  };

  const addFoodItem = (item: FoodPotassiumItem) => {
    const entry: MealFoodSelection = {
      key: newSelectionKey(),
      foodItemId: item.id,
      name: item.name,
      quantity: '1',
      potassiumMg: item.potassiumMgPerServing,
      proteinG: item.proteinGPerServing ?? 0,
      kcal: item.kcalPerServing ?? 0,
      sodiumMg: item.sodiumMgPerServing ?? 0,
      phosphorusMg: item.phosphorusMgPerServing ?? 0,
    };
    const scaled = recalcEntrySync(entry);
    onSelectedFoodsChange([...selectedFoods, scaled]);
    setOpen(true);
  };

  const updateEntry = (key: string, patch: Partial<MealFoodSelection>) => {
    let next = selectedFoods.map((f) => (f.key === key ? { ...f, ...patch } : f));

    if (patch.quantity !== undefined) {
      next = next.map((f) => (f.key === key ? recalcEntrySync(f) : f));
    }

    onSelectedFoodsChange(next);
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
          {item.sodiumMgPerServing != null ? ` · ${item.sodiumMgPerServing} mg Na` : ''}
          {item.phosphorusMgPerServing != null ? ` · ${item.phosphorusMgPerServing} mg P` : ''}
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
          Enter a quantity per food (1, 2, 2.5). Hover the ? on Qty for grams and serving details.
        </p>
      </div>

      {selectedFoods.length > 0 && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
          {selectedFoods.map((food) => {
            const meta = food.foodItemId ? foodMetaById.get(food.foodItemId) : undefined;
            const tooltipText = servingTooltipText(meta);
            return (
            <div
              key={food.key}
              className="grid gap-2 rounded-md border bg-background p-3 sm:grid-cols-[1fr_auto_auto]"
            >
              <div className="space-y-2 sm:col-span-3 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-end sm:gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Food</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-normal">
                      {food.name}
                    </Badge>
                  </div>
                </div>
                <div className="w-24">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Qty</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`Serving info for ${food.name}`}
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-[280px] text-xs leading-relaxed whitespace-pre-line">
                        {tooltipText}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    className="mt-1 h-8"
                    type="number"
                    min={0.25}
                    step={0.25}
                    inputMode="decimal"
                    value={food.quantity}
                    onChange={(e) => updateEntry(food.key, { quantity: e.target.value })}
                    onBlur={() => {
                      if (!food.quantity.trim() || Number(food.quantity) <= 0) {
                        updateEntry(food.key, { quantity: '1' });
                      }
                    }}
                    placeholder="1"
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
              <div className="grid grid-cols-2 gap-2 sm:col-span-3 sm:grid-cols-5">
                <div>
                  <Label className="text-xs text-muted-foreground">K (mg)</Label>
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
                <div>
                  <Label className="text-xs text-muted-foreground">Na (mg)</Label>
                  <Input
                    className="mt-1 h-8"
                    type="number"
                    value={food.sodiumMg || ''}
                    onChange={(e) =>
                      updateEntry(food.key, {
                        sodiumMg: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">P (mg)</Label>
                  <Input
                    className="mt-1 h-8"
                    type="number"
                    value={food.phosphorusMg || ''}
                    onChange={(e) =>
                      updateEntry(food.key, {
                        phosphorusMg: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          );
          })}
          <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm font-medium pt-1">
            <span>Meal K: {Math.round(totalPotassium * 10) / 10} mg</span>
            <span>Protein: {Math.round(totalProtein * 10) / 10} g</span>
            <span>Kcal: {Math.round(totalKcal)}</span>
            <span>Na: {Math.round(totalSodium * 10) / 10} mg</span>
            <span>P: {Math.round(totalPhosphorus * 10) / 10} mg</span>
          </div>
        </div>
      )}
    </div>
  );
}
