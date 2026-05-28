import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Utensils, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
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

type MealSuggestion = {
  id: string;
  label: string;
  meal: NutritionDiaryEntry['meals'][number];
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
  const { patient, isAuthenticated, user } = useAuth();
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!patient?.id) return;
    api.fetchNutritionDiaries(patient.id).then(setRecentDiaries).catch(console.error);
  }, [patient?.id]);

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
  }, [diaryDate, recentDiaries, patient?.id]);

  if (!isAuthenticated || !patient) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'patient') {
    return <Navigate to="/admin" replace />;
  }

  const updateMeal = (type: string, patch: Partial<MealFormState>) => {
    setMeals((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  };

  const getMealSuggestions = (mealType: string): MealSuggestion[] => {
    const rows: MealSuggestion[] = [];
    for (const diary of recentDiaries) {
      if (diary.diaryDate === diaryDate) continue;
      for (const meal of diary.meals ?? []) {
        if ((meal.mealType ?? '').toLowerCase() !== mealType.toLowerCase()) continue;
        const title = meal.foodName || meal.foodDescription || 'Saved meal';
        rows.push({
          id: `${diary.id}-${meal.id ?? title}`,
          label: `${diary.diaryDate} - ${title}`,
          meal,
        });
      }
    }
    return rows.slice(0, 10);
  };

  const applySuggestion = (mealType: string, suggestionId: string) => {
    const suggestion = getMealSuggestions(mealType).find((s) => s.id === suggestionId);
    if (!suggestion) return;
    const source = suggestion.meal;
    const nutrients = Object.fromEntries(
      (source.nutrients ?? []).map((n) => [n.nutrientCode, String(n.amount ?? '')])
    );
    updateMeal(mealType, {
      foodName: source.foodName ?? '',
      portionSize: source.portionSize ?? '',
      foodDescription: source.foodDescription ?? '',
      protein: nutrients.PROTEIN ?? '',
      sodium: nutrients.SODIUM ?? '',
      phosphorus: nutrients.PHOSPHORUS ?? '',
      potassium: nutrients.POTASSIUM ?? '',
      medicalDetails:
        typeof source.medicalDetails === 'string'
          ? source.medicalDetails
          : JSON.stringify(source.medicalDetails ?? {}),
    });
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
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to dashboard
        </Button>

        <Card className="shadow-clinical">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Renal nutrition diary
            </CardTitle>
            <CardDescription>
              Primary storage: PostgreSQL. Copies sync to Fuseki (KG) and Neo4j (property graph).
            </CardDescription>
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
              const suggestions = getMealSuggestions(key);
              return (
                <Card key={key} className="border-dashed">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {suggestions.length > 0 && (
                      <div className="sm:col-span-2">
                        <Label>Reuse from history</Label>
                        <Select onValueChange={(value) => applySuggestion(key, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pick a previous meal to autofill" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectLabel>Recent saved meals</SelectLabel>
                            {suggestions.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="sm:col-span-2">
                      <Label>Food name</Label>
                      <Input
                        value={m.foodName}
                        onChange={(e) => updateMeal(key, { foodName: e.target.value })}
                        placeholder="e.g. Oats, banana, rice"
                      />
                    </div>
                    <div>
                      <Label>Portion size</Label>
                      <Input
                        value={m.portionSize}
                        onChange={(e) => updateMeal(key, { portionSize: e.target.value })}
                        placeholder="e.g. 1 bowl / 150 g"
                      />
                    </div>
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
                    <div>
                      <Label>Potassium (mg)</Label>
                      <Input
                        type="number"
                        value={m.potassium}
                        onChange={(e) => updateMeal(key, { potassium: e.target.value })}
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
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {recentDiaries.slice(0, 7).map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between border-b pb-2 cursor-pointer hover:text-primary"
                  onClick={() => setDiaryDate(d.diaryDate)}
                >
                  <span>{d.diaryDate}</span>
                  <span className="text-muted-foreground">
                    K {d.totalPotassiumMg ?? '—'} mg · {d.alerts?.length ?? 0} alert(s)
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
