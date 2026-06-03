import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePatientDiaryPage } from '@/hooks/usePatientDiaryPage';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Utensils, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import { DiaryEntryViewDialog } from '@/components/clinical/DiaryEntryViewDialog';
import { FoodPotassiumInput } from '@/components/clinical/FoodPotassiumInput';
import { nowISTClock } from '@/lib/datetime';
import type { NutritionDiaryEntry, NutritionMealInput } from '@/types';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snacks', label: 'Snacks & Other' },
] as const;

type MealFormState = {
  foodName: string;
  portionSize: string;
  foodDescription: string;
  protein: string;
  sodium: string;
  phosphorus: string;
  potassium: string;
  medicalDetails: string;
};

const emptyMeal = (): MealFormState => ({
  foodName: '',
  portionSize: '',
  foodDescription: '',
  protein: '',
  sodium: '',
  phosphorus: '',
  potassium: '',
  medicalDetails: '',
});

export default function NutritionDiaryPage() {
  const {
    activePatient,
    backPath,
    isAuthenticated,
    staffMissingRoute,
    staffPatientNotFound,
    patientMismatch,
    isTechnician,
  } = usePatientDiaryPage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [diaryDate, setDiaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<Record<string, MealFormState>>({
    breakfast: emptyMeal(),
    lunch: emptyMeal(),
    dinner: emptyMeal(),
    snacks: emptyMeal(),
  });
  const [notes, setNotes] = useState('');
  const [medicineDiary, setMedicineDiary] = useState('');
  const [recentDiaries, setRecentDiaries] = useState<NutritionDiaryEntry[]>([]);
  const [previewEntry, setPreviewEntry] = useState<NutritionDiaryEntry | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activePatient?.id) return;
    api.fetchNutritionDiaries(activePatient.id).then(setRecentDiaries).catch(console.error);
  }, [activePatient?.id]);

  useEffect(() => {
    if (!patient?.id) return;
    const existing = recentDiaries.find((d) => d.diaryDate === diaryDate);
    if (!existing) return;
    const next: Record<string, MealFormState> = {
      breakfast: emptyMeal(),
      lunch: emptyMeal(),
      dinner: emptyMeal(),
      snacks: emptyMeal(),
    };
    for (const m of existing.meals) {
      const key = m.mealType.toLowerCase();
      const nutrients = Object.fromEntries(
        (m.nutrients ?? []).map((n) => [n.nutrientCode, String(n.amount ?? '')])
      );
      next[key] = {
        foodName: m.foodName ?? '',
        portionSize: m.portionSize ?? '',
        foodDescription: m.foodDescription ?? '',
        protein: nutrients.PROTEIN ?? '',
        sodium: nutrients.SODIUM ?? '',
        phosphorus: nutrients.PHOSPHORUS ?? '',
        potassium: nutrients.POTASSIUM ?? '',
        medicalDetails:
          typeof m.medicalDetails === 'string'
            ? m.medicalDetails
            : JSON.stringify(m.medicalDetails ?? {}),
      };
    }
    setMeals(next);
    setNotes(existing.notesEndOfDay ?? '');
    setMedicineDiary(existing.medicineDiary ?? '');
  }, [diaryDate, recentDiaries, activePatient?.id]);

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

  const buildMealsPayload = (): NutritionMealInput[] => {
    return MEAL_TYPES.map(({ key, label }) => {
      const m = meals[key];
      const nutrients = [];
      if (m.protein) nutrients.push({ nutrient_code: 'PROTEIN', amount: Number(m.protein), unit: 'g' });
      if (m.sodium) nutrients.push({ nutrient_code: 'SODIUM', amount: Number(m.sodium), unit: 'mg' });
      if (m.phosphorus) nutrients.push({ nutrient_code: 'PHOSPHORUS', amount: Number(m.phosphorus), unit: 'mg' });
      if (m.potassium) nutrients.push({ nutrient_code: 'POTASSIUM', amount: Number(m.potassium), unit: 'mg' });

      let medicalDetails: Record<string, unknown> = {};
      if (m.medicalDetails.trim()) {
        try {
          medicalDetails = JSON.parse(m.medicalDetails);
        } catch {
          medicalDetails = { note: m.medicalDetails.trim() };
        }
      }

      return {
        meal_type: key,
        food_name: m.foodName || undefined,
        portion_size: m.portionSize || undefined,
        food_description: m.foodDescription || `${label} — not specified`,
        nutrition_facts: {
          protein_g: m.protein ? Number(m.protein) : undefined,
          sodium_mg: m.sodium ? Number(m.sodium) : undefined,
          phosphorus_mg: m.phosphorus ? Number(m.phosphorus) : undefined,
          potassium_mg: m.potassium ? Number(m.potassium) : undefined,
        },
        medical_details: medicalDetails,
        nutrients,
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.saveNutritionDiary(patient.id, {
        diary_date: diaryDate,
        notes_end_of_day: notes || undefined,
        medicine_diary: medicineDiary || undefined,
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

        <Card className="shadow-clinical">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Renal nutrition diary
              {isTechnician && (
                <span className="text-sm font-normal text-muted-foreground">— {patient.name}</span>
              )}
            </CardTitle>
            <CardDescription>
              Select fruits/vegetables to auto-calculate potassium (mg). Times shown in IST.
            </CardDescription>
            <p className="text-xs text-muted-foreground">Current time (IST): {nowISTClock()}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Label htmlFor="diaryDate">Date</Label>
              <Input
                id="diaryDate"
                type="date"
                value={diaryDate}
                onChange={(e) => setDiaryDate(e.target.value)}
              />
            </div>

            {MEAL_TYPES.map(({ key, label }) => {
              const m = meals[key];
              return (
                <Card key={key} className="border-dashed">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <FoodPotassiumInput
                      foodName={m.foodName}
                      portionSize={m.portionSize}
                      potassium={m.potassium}
                      onFoodNameChange={(v) => updateMeal(key, { foodName: v })}
                      onPortionSizeChange={(v) => updateMeal(key, { portionSize: v })}
                      onPotassiumChange={(v) => updateMeal(key, { potassium: v })}
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
                      <Label>Protein (g)</Label>
                      <Input
                        type="number"
                        value={m.protein}
                        onChange={(e) => updateMeal(key, { protein: e.target.value })}
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
                      K {d.totalPotassiumMg ?? '—'} mg · {d.alerts?.length ?? 0} alert(s)
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
              {previewEntry.meals.map((meal) => (
                <div key={meal.id ?? meal.mealType} className="border rounded-lg p-3 space-y-1">
                  <p className="font-medium capitalize">{meal.mealType}</p>
                  <p>{meal.foodName || meal.foodDescription || '—'}</p>
                  {meal.portionSize && (
                    <p className="text-muted-foreground">Portion: {meal.portionSize}</p>
                  )}
                  {(meal.nutrients ?? []).length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {(meal.nutrients ?? [])
                        .map((n) => `${n.nutrientCode}: ${n.amount ?? '—'} ${n.unit}`)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              ))}
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
      </main>
    </div>
  );
}
