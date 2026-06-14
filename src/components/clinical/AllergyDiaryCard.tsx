import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchHealthHistory, saveAllergyDiary } from '@/services/api';

type AllergyDiaryCardProps = {
  patientId: string;
};

export function AllergyDiaryCard({ patientId }: AllergyDiaryCardProps) {
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
    setLoading(true);
    try {
      const data = await fetchHealthHistory(patientId);
      setDrugAllergiesNone(data.drug_allergies_none ?? false);
      setDrugAllergiesList(data.drug_allergies_list || '');
      setFoodAllergiesNone(data.food_env_allergies_none ?? false);
      setFoodAllergiesList(data.food_env_allergies_list || '');
      setLatexReaction(data.latex_contrast_reaction || '');
      setLatexDetails(data.latex_contrast_details || '');
    } catch {
      /* first-time entry is fine */
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAllergyDiary(patientId, {
        drug_allergies_none: drugAllergiesNone,
        drug_allergies_list: drugAllergiesList,
        food_env_allergies_none: foodAllergiesNone,
        food_env_allergies_list: foodAllergiesList,
        latex_contrast_reaction: latexReaction || null,
        latex_contrast_details: latexDetails,
      });
      toast({ title: 'Allergy diary saved' });
    } catch {
      toast({ title: 'Could not save allergies', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-clinical border-amber-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          Allergy diary
        </CardTitle>
        <CardDescription>
          Record drug, food, or latex/contrast allergies. Saved to your health record and included in
          care reports.
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
  );
}
