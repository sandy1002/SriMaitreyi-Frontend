import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { usePatientDiaryPage } from '@/hooks/usePatientDiaryPage';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Utensils, Save, Plus, TrendingUp, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import { DiaryEntryViewDialog } from '@/components/clinical/DiaryEntryViewDialog';
import { FoodPotassiumInput, type MealFoodSelection, parsePortionQuantity, formatPortionSizeForSave } from '@/components/clinical/FoodPotassiumInput';
import { FoodItemFormDialog } from '@/components/clinical/FoodItemFormDialog';
import { FoodCatalogDialog } from '@/components/clinical/FoodCatalogDialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { nowISTClock } from '@/lib/datetime';
import type { FoodPotassiumItem, NutritionDiaryEntry, NutritionMealInput } from '@/types';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'pre_lunch', label: 'Pre Lunch' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
  { key: 'other', label: 'Other' },
] as const;

const MEAL_TYPE_KEYS = MEAL_TYPES.map((m) => m.key);

const LEGACY_MEAL_TYPE_ALIASES: Record<string, (typeof MEAL_TYPE_KEYS)[number]> = {
  snacks: 'snack',
};

function normalizeMealTypeKey(type: string): string {
  const key = type.toLowerCase();
  return LEGACY_MEAL_TYPE_ALIASES[key] ?? key;
}

function emptyMealsState(): Record<string, MealFormState> {
  return Object.fromEntries(MEAL_TYPE_KEYS.map((k) => [k, emptyMeal()]));
}

type MealFormState = {
  foods: MealFoodSelection[];
  foodDescription: string;
  mealTakenTime: string;
  protein: string;
  sodium: string;
  phosphorus: string;
  medicalDetails: string;
};

const emptyMeal = (): MealFormState => ({
  foods: [],
  foodDescription: '',
  mealTakenTime: '',
  protein: '',
  sodium: '',
  phosphorus: '',
  medicalDetails: '',
});

const nutritionChartConfig = {
  potassium: { label: 'K (mg)', color: 'hsl(var(--chart-1))' },
  protein: { label: 'Protein (g)', color: 'hsl(var(--chart-2))' },
  kcal: { label: 'Kcal', color: 'hsl(var(--chart-3))' },
};

function sumFoodNutrients(foods: MealFoodSelection[]) {
  return foods.reduce(
    (acc, f) => ({
      potassium: acc.potassium + (f.potassiumMg || 0),
      protein: acc.protein + (f.proteinG || 0),
      kcal: acc.kcal + (f.kcal || 0),
    }),
    { potassium: 0, protein: 0, kcal: 0 }
  );
}

function formatNutrientTotal(value: number, decimals = 0) {
  if (decimals === 0) return String(Math.round(value));
  return String(Math.round(value * 10) / 10);
}

export default function NutritionDiaryPage() {
  const {
    activePatient,
    targetPatientId,
    backPath,
    isAuthenticated,
    staffMissingRoute,
    staffPatientNotFound,
    patientMismatch,
    isTechnician,
  } = usePatientDiaryPage();
  const { isStaff, isAdmin } = useAuth();
  const canEditGlobalCatalog = isStaff || isAdmin;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [diaryDate, setDiaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<Record<string, MealFormState>>(emptyMealsState);
  const [notes, setNotes] = useState('');
  const [medicineDiary, setMedicineDiary] = useState('');
  const [recentDiaries, setRecentDiaries] = useState<NutritionDiaryEntry[]>([]);
  const [previewEntry, setPreviewEntry] = useState<NutritionDiaryEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodPotassiumItem[]>([]);
  const [showAddFoodDialog, setShowAddFoodDialog] = useState(false);
  const [showFoodCatalog, setShowFoodCatalog] = useState(false);

  const loadFoodItems = async (patientId: string) => {
    try {
      const items = await api.fetchFoodPotassiumList(patientId);
      setFoodItems(items);
    } catch {
      setFoodItems([]);
    }
  };

  useEffect(() => {
    if (!activePatient?.id) return;
    api.fetchNutritionDiaries(activePatient.id).then(setRecentDiaries).catch(console.error);
    loadFoodItems(activePatient.id);
  }, [activePatient?.id]);

  useEffect(() => {
    if (!activePatient?.id) return;
    const existing = recentDiaries.find((d) => d.diaryDate === diaryDate);
    if (!existing) {
      setMeals(emptyMealsState());
      setNotes('');
      setMedicineDiary('');
      return;
    }
    const next = emptyMealsState();
    const mealsByType: Record<string, typeof existing.meals> = Object.fromEntries(
      MEAL_TYPE_KEYS.map((k) => [k, [] as typeof existing.meals])
    );
    for (const m of existing.meals) {
      const key = normalizeMealTypeKey(m.mealType);
      if (mealsByType[key]) mealsByType[key].push(m);
    }
    for (const key of MEAL_TYPE_KEYS) {
      const rows = mealsByType[key] ?? [];
      if (rows.length === 0) continue;
      const first = rows[0];
      const nutrients = Object.fromEntries(
        (first.nutrients ?? []).map((n) => [n.nutrientCode, String(n.amount ?? '')])
      );
      let mealTakenTime = '';
      if (first.mealTakenAt) {
        const raw = first.mealTakenAt;
        mealTakenTime = raw.includes('T') ? raw.slice(11, 16) : raw.slice(0, 5);
      }
      const foods: MealFoodSelection[] = rows
        .filter(
          (m) =>
            m.foodName ||
            m.portionSize ||
            (m.nutrients ?? []).some((n) => n.nutrientCode === 'POTASSIUM' && n.amount)
        )
        .map((m, idx) => {
          const rowNutrients = Object.fromEntries(
            (m.nutrients ?? []).map((n) => [n.nutrientCode, n.amount ?? 0])
          );
          const catalogMatch = foodItems.find(
            (f) => f.name.toLowerCase() === (m.foodName ?? '').toLowerCase()
          );
          return {
            key: m.id ?? `loaded-${key}-${idx}`,
            foodItemId: catalogMatch?.id,
            name: m.foodName ?? '',
            quantity: parsePortionQuantity(m.portionSize),
            potassiumMg: Number(rowNutrients.POTASSIUM ?? 0),
            proteinG: Number(rowNutrients.PROTEIN ?? 0),
            kcal: Number(rowNutrients.ENERGY ?? 0),
          };
        });
      const foodTotals = sumFoodNutrients(foods);
      next[key] = {
        foods,
        foodDescription: first.foodDescription ?? '',
        mealTakenTime,
        protein:
          foods.length > 0
            ? formatNutrientTotal(foodTotals.protein, 1)
            : nutrients.PROTEIN ?? '',
        sodium: nutrients.SODIUM ?? '',
        phosphorus: nutrients.PHOSPHORUS ?? '',
        medicalDetails:
          typeof first.medicalDetails === 'string'
            ? first.medicalDetails
            : JSON.stringify(first.medicalDetails ?? {}),
      };
    }
    setMeals(next);
    setNotes(existing.notesEndOfDay ?? '');
    setMedicineDiary(existing.medicineDiary ?? '');
  }, [diaryDate, recentDiaries, activePatient?.id, foodItems]);

  const editingDailyTotals = useMemo(() => {
    let potassium = 0;
    let protein = 0;
    let kcal = 0;
    for (const key of MEAL_TYPE_KEYS) {
      const m = meals[key];
      const foodTotals = sumFoodNutrients(m.foods);
      potassium += foodTotals.potassium;
      protein += foodTotals.protein;
      kcal += foodTotals.kcal;
      if (m.foods.length === 0 && m.protein) protein += Number(m.protein) || 0;
    }
    return { potassium, protein, kcal };
  }, [meals]);

  const nutritionTrendData = useMemo(() => {
    return [...recentDiaries]
      .sort((a, b) => a.diaryDate.localeCompare(b.diaryDate))
      .slice(-14)
      .map((d) => ({
        label: d.diaryDate.slice(5),
        potassium: d.totalPotassiumMg ?? 0,
        protein: d.totalProteinG ?? 0,
        kcal: d.totalKcal ?? 0,
        isCurrent: d.diaryDate === diaryDate,
      }));
  }, [recentDiaries, diaryDate]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (staffMissingRoute) return <Navigate to="/staff" replace />;
  if (patientMismatch) return <Navigate to="/dashboard" replace />;
  if (!activePatient) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-12 text-center text-muted-foreground">
          {staffPatientNotFound ? 'Patient not found.' : 'Select a patient from the staff workspace.'}
        </main>
      </div>
    );
  }

  const patient = activePatient;

  const updateMeal = (type: string, patch: Partial<MealFormState>) => {
    setMeals((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  };

  const handleFoodsChange = (mealKey: string, foods: MealFoodSelection[]) => {
    const totals = sumFoodNutrients(foods);
    updateMeal(mealKey, {
      foods,
      protein: foods.length > 0 ? formatNutrientTotal(totals.protein, 1) : meals[mealKey].protein,
    });
  };

  const buildMealsPayload = (): NutritionMealInput[] => {
    const result: NutritionMealInput[] = [];
    for (const { key, label } of MEAL_TYPES) {
      const m = meals[key];
      const mealTakenAt =
        m.mealTakenTime.trim() !== ''
          ? `${diaryDate}T${m.mealTakenTime.trim()}:00+05:30`
          : undefined;

      let medicalDetails: Record<string, unknown> = {};
      if (m.medicalDetails.trim()) {
        try {
          medicalDetails = JSON.parse(m.medicalDetails);
        } catch {
          medicalDetails = { note: m.medicalDetails.trim() };
        }
      }

      if (m.foods.length > 0) {
        m.foods.forEach((food, index) => {
          const catalogItem = food.foodItemId
            ? foodItems.find((f) => f.id === food.foodItemId)
            : undefined;
          const nutrients = [
            { nutrient_code: 'POTASSIUM', amount: food.potassiumMg, unit: 'mg' },
          ];
          if (food.proteinG != null && !Number.isNaN(Number(food.proteinG))) {
            nutrients.push({ nutrient_code: 'PROTEIN', amount: Number(food.proteinG), unit: 'g' });
          }
          if (food.kcal != null && !Number.isNaN(Number(food.kcal))) {
            nutrients.push({ nutrient_code: 'ENERGY', amount: Number(food.kcal), unit: 'kcal' });
          }
          if (index === 0 && m.sodium) {
            nutrients.push({ nutrient_code: 'SODIUM', amount: Number(m.sodium), unit: 'mg' });
          }
          if (index === 0 && m.phosphorus) {
            nutrients.push({ nutrient_code: 'PHOSPHORUS', amount: Number(m.phosphorus), unit: 'mg' });
          }
          result.push({
            meal_type: key,
            food_name: food.name || undefined,
            portion_size: formatPortionSizeForSave(
              food.quantity,
              catalogItem?.servingDescription
            ),
            meal_taken_at: mealTakenAt,
            food_description:
              m.foodDescription ||
              (m.foods.length > 1 ? `${label}: ${food.name}` : food.name || `${label} — not specified`),
            nutrition_facts: {
              protein_g: food.proteinG || undefined,
              sodium_mg: index === 0 && m.sodium ? Number(m.sodium) : undefined,
              phosphorus_mg: index === 0 && m.phosphorus ? Number(m.phosphorus) : undefined,
              potassium_mg: food.potassiumMg || undefined,
              kcal: food.kcal || undefined,
            },
            medical_details: index === 0 ? medicalDetails : {},
            nutrients,
          });
        });
        continue;
      }

      const nutrients = [];
      if (m.protein) nutrients.push({ nutrient_code: 'PROTEIN', amount: Number(m.protein), unit: 'g' });
      if (m.sodium) nutrients.push({ nutrient_code: 'SODIUM', amount: Number(m.sodium), unit: 'mg' });
      if (m.phosphorus) nutrients.push({ nutrient_code: 'PHOSPHORUS', amount: Number(m.phosphorus), unit: 'mg' });

      const hasOtherData =
        m.foodDescription.trim() ||
        m.protein ||
        m.sodium ||
        m.phosphorus ||
        m.medicalDetails.trim() ||
        mealTakenAt;

      if (!hasOtherData) continue;

      result.push({
        meal_type: key,
        meal_taken_at: mealTakenAt,
        food_description: m.foodDescription || `${label} — not specified`,
        nutrition_facts: {
          protein_g: m.protein ? Number(m.protein) : undefined,
          sodium_mg: m.sodium ? Number(m.sodium) : undefined,
          phosphorus_mg: m.phosphorus ? Number(m.phosphorus) : undefined,
        },
        medical_details: medicalDetails,
        nutrients,
      });
    }
    return result;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.saveNutritionDiary(patient.id, {
        diary_date: diaryDate,
        notes_end_of_day: notes || undefined,
        medicine_diary: medicineDiary || undefined,
        total_protein_g: editingDailyTotals.protein || undefined,
        total_potassium_mg: editingDailyTotals.potassium || undefined,
        meals: buildMealsPayload(),
      });
      toast({
        title: 'Nutrition diary saved',
        description:
          result.checks.length > 0
            ? `${result.checks.length} item(s) to review. Synced to knowledge & property graphs.`
            : 'Stored in PostgreSQL and synced to graphs.',
      });
      const list = await api.fetchNutritionDiaries(patient.id);
      setRecentDiaries(list);
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-4xl space-y-6">
        <Button variant="ghost" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isTechnician ? 'Back to staff workspace' : 'Back to dashboard'}
        </Button>

        {nutritionTrendData.length > 1 && (
          <Card className="shadow-clinical">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Nutrition trends
              </CardTitle>
              <CardDescription>
                Daily potassium, protein, and kcal from saved diary entries (values shown on each bar).
                K limit guideline: 2000 mg/day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={nutritionChartConfig} className="h-[260px] w-full">
                <BarChart data={nutritionTrendData} margin={{ left: 4, right: 8, top: 28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={42}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={42}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    yAxisId="left"
                    dataKey="potassium"
                    fill="var(--color-potassium)"
                    radius={[3, 3, 0, 0]}
                    name="K (mg)"
                  >
                    <LabelList
                      dataKey="potassium"
                      position="top"
                      fontSize={9}
                      formatter={(v: number) => (v ? Math.round(v) : '')}
                    />
                  </Bar>
                  <Bar
                    yAxisId="left"
                    dataKey="protein"
                    fill="var(--color-protein)"
                    radius={[3, 3, 0, 0]}
                    name="Protein (g)"
                  >
                    <LabelList
                      dataKey="protein"
                      position="top"
                      fontSize={9}
                      formatter={(v: number) => (v ? Number(v).toFixed(1) : '')}
                    />
                  </Bar>
                  <Bar
                    yAxisId="right"
                    dataKey="kcal"
                    fill="var(--color-kcal)"
                    radius={[3, 3, 0, 0]}
                    name="Kcal"
                  >
                    <LabelList
                      dataKey="kcal"
                      position="top"
                      fontSize={9}
                      formatter={(v: number) => (v ? Math.round(v) : '')}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
              <p className="mt-2 text-xs text-muted-foreground">
                Left axis: potassium (mg) &amp; protein (g). Right axis: kcal. Values shown on each bar.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-clinical">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Renal nutrition diary
                  {isTechnician && (
                    <span className="text-sm font-normal text-muted-foreground">— {patient.name}</span>
                  )}
                </CardTitle>
                <CardDescription>
                  Search and add multiple foods per meal. Potassium, protein, and kcal auto-calculate from portions.
                </CardDescription>
                <p className="text-xs text-muted-foreground">Current time (IST): {nowISTClock()}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFoodCatalog(true)}
                >
                  <Settings2 className="h-4 w-4 mr-1" />
                  Manage foods
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddFoodDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add food
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="max-w-xs">
                <Label htmlFor="diaryDate">Date</Label>
                <Input
                  id="diaryDate"
                  type="date"
                  value={diaryDate}
                  onChange={(e) => setDiaryDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px] rounded-lg border bg-muted/30 px-4 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">Today&apos;s running totals (from form)</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
                  <span>K: {formatNutrientTotal(editingDailyTotals.potassium)} mg</span>
                  <span>Protein: {formatNutrientTotal(editingDailyTotals.protein, 1)} g</span>
                  <span>Kcal: {formatNutrientTotal(editingDailyTotals.kcal)}</span>
                </div>
              </div>
            </div>

            {MEAL_TYPES.map(({ key, label }) => {
              const m = meals[key];
              const mealFoodTotals = sumFoodNutrients(m.foods);
              return (
                <Card key={key} className="border-dashed">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{label}</CardTitle>
                      {m.foods.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          K {formatNutrientTotal(mealFoodTotals.potassium)} mg · Protein{' '}
                          {formatNutrientTotal(mealFoodTotals.protein, 1)} g · Kcal{' '}
                          {formatNutrientTotal(mealFoodTotals.kcal)}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Time eaten (IST)</Label>
                      <Input
                        type="time"
                        value={m.mealTakenTime}
                        onChange={(e) => updateMeal(key, { mealTakenTime: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Used to calculate interdialytic potassium between sessions.
                      </p>
                    </div>
                    <FoodPotassiumInput
                      patientId={targetPatientId}
                      foodItems={foodItems}
                      selectedFoods={m.foods}
                      onSelectedFoodsChange={(foods) => handleFoodsChange(key, foods)}
                    />
                    <div className="sm:col-span-2">
                      <Label>Food description / portions</Label>
                      <Input
                        value={m.foodDescription}
                        onChange={(e) => updateMeal(key, { foodDescription: e.target.value })}
                        placeholder="What did you eat?"
                      />
                    </div>
                    <div>
                      <Label>Protein (g){m.foods.length > 0 ? ' — auto from foods' : ''}</Label>
                      <Input
                        type="number"
                        value={m.protein}
                        onChange={(e) => updateMeal(key, { protein: e.target.value })}
                        readOnly={m.foods.length > 0}
                        className={m.foods.length > 0 ? 'bg-muted/50' : undefined}
                      />
                    </div>
                    <div>
                      <Label>Sodium (mg)</Label>
                      <Input
                        type="number"
                        value={m.sodium}
                        onChange={(e) => updateMeal(key, { sodium: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phosphorus (mg)</Label>
                      <Input
                        type="number"
                        value={m.phosphorus}
                        onChange={(e) => updateMeal(key, { phosphorus: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Medical details (for reuse)</Label>
                      <Input
                        value={m.medicalDetails}
                        onChange={(e) => updateMeal(key, { medicalDetails: e.target.value })}
                        placeholder='JSON or text, e.g. {"diabetic_friendly": true}'
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div>
              <Label>Medicine diary</Label>
              <Textarea
                value={medicineDiary}
                onChange={(e) => setMedicineDiary(e.target.value)}
                rows={2}
                placeholder="Daily medicine notes, timing, symptoms"
              />
            </div>
            <div>
              <Label>End of day notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving…' : 'Save diary (Postgres + graphs)'}
            </Button>
          </CardContent>
        </Card>

        {recentDiaries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent entries</CardTitle>
              <CardDescription>
                Click a date to preview that day&apos;s log. Use &quot;Load into form&quot; to edit.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {recentDiaries.slice(0, 7).map((d) => {
                const isSelected = d.diaryDate === diaryDate;
                return (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    className={`flex justify-between border-b pb-2 cursor-pointer hover:text-primary ${
                      isSelected ? 'text-primary font-medium' : ''
                    }`}
                    onClick={() => setPreviewEntry(d)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setPreviewEntry(d);
                    }}
                  >
                    <span>{d.diaryDate}</span>
                    <span className="text-muted-foreground">
                      K {d.totalPotassiumMg ?? '—'} mg · Protein {d.totalProteinG ?? '—'} g · Kcal{' '}
                      {d.totalKcal ?? '—'}
                      {isSelected ? ' · in form' : ''}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <DiaryEntryViewDialog
          open={!!previewEntry}
          onOpenChange={(open) => !open && setPreviewEntry(null)}
          dateLabel={previewEntry ? `Nutrition — ${previewEntry.diaryDate}` : ''}
          subtitle="Saved entry (read-only)"
          onLoadIntoForm={() => previewEntry && setDiaryDate(previewEntry.diaryDate)}
        >
          {previewEntry && (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3">
                <div>
                  <span className="text-muted-foreground">Protein</span>
                  <p className="font-medium">{previewEntry.totalProteinG ?? '—'} g</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Kcal</span>
                  <p className="font-medium">{previewEntry.totalKcal ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sodium</span>
                  <p className="font-medium">{previewEntry.totalSodiumMg ?? '—'} mg</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phosphorus</span>
                  <p className="font-medium">{previewEntry.totalPhosphorusMg ?? '—'} mg</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Potassium</span>
                  <p className="font-medium">{previewEntry.totalPotassiumMg ?? '—'} mg</p>
                </div>
              </div>
              {previewEntry.meals.map((meal) => {
                const nutrients = Object.fromEntries(
                  (meal.nutrients ?? []).map((n) => [n.nutrientCode, n])
                );
                return (
                  <div
                    key={meal.id ?? meal.mealType + (meal.foodName ?? '')}
                    className="border rounded-lg p-3 space-y-1"
                  >
                    <p className="font-medium capitalize">{meal.mealType.replace('_', ' ')}</p>
                    <p>{meal.foodName || meal.foodDescription || '—'}</p>
                    {meal.portionSize && (
                      <p className="text-muted-foreground">Portion: {meal.portionSize}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {[
                        nutrients.POTASSIUM && `K: ${nutrients.POTASSIUM.amount} mg`,
                        nutrients.PROTEIN && `Protein: ${nutrients.PROTEIN.amount} g`,
                        nutrients.ENERGY && `Kcal: ${nutrients.ENERGY.amount}`,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </div>
                );
              })}
              {previewEntry.medicineDiary && (
                <div>
                  <p className="font-medium">Medicine diary</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewEntry.medicineDiary}</p>
                </div>
              )}
              {previewEntry.notesEndOfDay && (
                <div>
                  <p className="font-medium">End of day notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewEntry.notesEndOfDay}</p>
                </div>
              )}
              {(previewEntry.alerts ?? []).length > 0 && (
                <div>
                  <p className="font-medium">Alerts ({previewEntry.alerts!.length})</p>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {previewEntry.alerts!.map((a) => (
                      <li key={a.id}>{a.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </DiaryEntryViewDialog>

        <FoodItemFormDialog
          open={showAddFoodDialog}
          onOpenChange={setShowAddFoodDialog}
          patientId={patient.id}
          onSaved={(item) => {
            setFoodItems((prev) => {
              const without = prev.filter((f) => f.id !== item.id);
              return [item, ...without];
            });
          }}
        />

        <FoodCatalogDialog
          open={showFoodCatalog}
          onOpenChange={setShowFoodCatalog}
          patientId={patient.id}
          editGlobal={canEditGlobalCatalog}
          onFoodsChanged={() => loadFoodItems(patient.id)}
        />
      </main>
    </div>
  );
}
