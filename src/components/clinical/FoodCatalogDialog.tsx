import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Search } from 'lucide-react';
import { fetchFoodPotassiumList } from '@/services/api';
import { FoodItemFormDialog } from '@/components/clinical/FoodItemFormDialog';
import type { FoodPotassiumItem } from '@/types';

type FoodCatalogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  editGlobal?: boolean;
  onFoodsChanged?: () => void;
};

function formatNutrients(item: FoodPotassiumItem) {
  const k100 = item.kcalPer100g ?? item.kcalPerServing;
  const p100 = item.proteinGPer100g ?? item.proteinGPerServing;
  const kMg = item.potassiumMgPer100g ?? item.potassiumMgPerServing;
  return {
    kcal: k100 != null ? `${Math.round(k100)} kcal/100g` : '—',
    protein: p100 != null ? `${p100} g protein/100g` : '—',
    potassium: kMg != null ? `${kMg} mg K/100g` : `${item.potassiumMgPerServing} mg K`,
  };
}

export function FoodCatalogDialog({
  open,
  onOpenChange,
  patientId,
  editGlobal = false,
  onFoodsChanged,
}: FoodCatalogDialogProps) {
  const [foods, setFoods] = useState<FoodPotassiumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodPotassiumItem | null>(null);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchFoodPotassiumList(patientId, 500);
      setFoods(items);
    } catch {
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (open) loadFoods();
  }, [open, loadFoods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.aliases ?? '').toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [foods, query]);

  const customFoods = filtered.filter((f) => f.isCustom);
  const referenceFoods = filtered.filter((f) => !f.isCustom);

  const handleSaved = (item: FoodPotassiumItem) => {
    setFoods((prev) => {
      const without = prev.filter((f) => f.id !== item.id && f.name !== item.name);
      return [item, ...without].sort((a, b) => a.name.localeCompare(b.name));
    });
    onFoodsChanged?.();
  };

  const openEdit = (food: FoodPotassiumItem) => {
    setEditingFood(food);
    setFormOpen(true);
  };

  const openAdd = () => {
    setEditingFood(null);
    setFormOpen(true);
  };

  const renderRow = (item: FoodPotassiumItem) => {
    const n = formatNutrients(item);
    return (
      <div
        key={item.id}
        className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0"
      >
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">{item.name}</span>
            {item.isCustom && (
              <Badge variant="secondary" className="text-xs">
                Yours
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {item.servingDescription}
            {item.servingGrams ? ` · ${item.servingGrams} g` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            {n.potassium} · {n.protein} · {n.kcal}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8"
          onClick={() => openEdit(item)}
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage food catalog</DialogTitle>
            <DialogDescription>
              Search, add, or edit potassium, protein, and kcal values. Tap the pencil to update a
              food.
              {editGlobal
                ? ' Staff mode: reference food edits update the global catalog.'
                : ' Reference food edits save a personal copy for this patient.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search foods…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="button" size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add food
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-1 -mr-1">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading foods…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No foods match your search.</p>
            ) : (
              <div className="space-y-4">
                {customFoods.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Your foods ({customFoods.length})
                    </p>
                    {customFoods.map(renderRow)}
                  </div>
                )}
                {referenceFoods.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Reference catalog ({referenceFoods.length})
                    </p>
                    {referenceFoods.map(renderRow)}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <FoodItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        patientId={patientId}
        food={editingFood}
        editGlobal={editGlobal}
        onSaved={handleSaved}
      />
    </>
  );
}
