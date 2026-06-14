import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePatientDiaryPage } from '@/hooks/usePatientDiaryPage';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchHealthHistory, saveAllergyDiary } from '@/services/api';

export default function AllergyDiaryPage() {
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drugAllergiesNone, setDrugAllergiesNone] = useState(false);
  const [drugAllergiesList, setDrugAllergiesList] = useState('');
  const [foodAllergiesNone, setFoodAllergiesNone] = useState(false);
  const [foodAllergiesList, setFoodAllergiesList] = useState('');
  const [latexReaction, setLatexReaction] = useState('');
  const [latexDetails, setLatexDetails] = useState('');

  const load = useCallback(async () => {
    if (!targetPatientId) return;
    setLoading(true);
    try {
      const data = await fetchHealthHistory(targetPatientId);
      setDrugAllergiesNone(data.drug_allergies_none ?? false);
      setDrugAllergiesList(data.drug_allergies_list || '');
      setFoodAllergiesNone(data.food_env_allergies_none ?? false);
      setFoodAllergiesList(data.food_env_allergies_list || '');
      setLatexReaction(data.latex_contrast_reaction || '');
      setLatexDetails(data.latex_contrast_details || '');
    } catch {
      /* first-time entry */
    } finally {
      setLoading(false);
    }
  }, [targetPatientId]);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleSave = async () => {
    if (!targetPatientId) return;
    setSaving(true);
    try {
      await saveAllergyDiary(targetPatientId, {
        drug_allergies_none: drugAllergiesNone,
        drug_allergies_list: drugAllergiesList,
        food_env_allergies_none: foodAllergiesNone,
        food_env_allergies_list: foodAllergiesList,
        latex_contrast_reaction: latexReaction || null,
        latex_contrast_details: latexDetails,
      });
      toast({ title: 'Allergy diary saved' });
      navigate(backPath);
    } catch {
      toast({ title: 'Could not save allergies', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isTechnician ? 'Back to staff workspace' : 'Back to dashboard'}
        </Button>

        <Card className="shadow-clinical border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Allergy diary
              {isTechnician && (
                <span className="text-sm font-normal text-muted-foreground">— {activePatient.name}</span>
              )}
            </CardTitle>
            <CardDescription>
              Record drug, food, or latex/contrast allergies. This is saved to your health record and
              included in care reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="drug-none"
                      checked={drugAllergiesNone}
                      onCheckedChange={(v) => setDrugAllergiesNone(!!v)}
                    />
                    <Label htmlFor="drug-none">No known drug allergies</Label>
                  </div>
                  <Input
                    value={drugAllergiesList}
                    onChange={(e) => setDrugAllergiesList(e.target.value)}
                    disabled={drugAllergiesNone}
                    placeholder="Drug allergies (e.g. penicillin, sulfa)"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="food-none"
                      checked={foodAllergiesNone}
                      onCheckedChange={(v) => setFoodAllergiesNone(!!v)}
                    />
                    <Label htmlFor="food-none">No known food / environmental allergies</Label>
                  </div>
                  <Input
                    value={foodAllergiesList}
                    onChange={(e) => setFoodAllergiesList(e.target.value)}
                    disabled={foodAllergiesNone}
                    placeholder="Food or environmental allergies"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Latex / contrast reaction</Label>
                    <Select value={latexReaction} onValueChange={setLatexReaction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select if applicable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No known reaction</SelectItem>
                        <SelectItem value="yes">Yes — reaction documented</SelectItem>
                        <SelectItem value="unknown">Unknown / not tested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reaction details</Label>
                    <Input
                      value={latexDetails}
                      onChange={(e) => setLatexDetails(e.target.value)}
                      placeholder="Describe reaction if any"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save allergy diary'
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
