import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import type { DialysisSession } from '@/types';
import { updateSession } from '@/services/api';

type SessionEditDialogProps = {
  session: DialysisSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function str(v: number | string | null | undefined) {
  return v == null ? '' : String(v);
}

export function SessionEditDialog({
  session,
  open,
  onOpenChange,
  onSaved,
}: SessionEditDialogProps) {
  const pre = session.preDialysisAssessment;
  const post = session.postDialysisAssessment;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionDate, setSessionDate] = useState(session.sessionDate);
  const [hospitalName, setHospitalName] = useState(session.hospitalName);
  const [weightKg, setWeightKg] = useState(str(pre?.weightKg));
  const [dryWeightKg, setDryWeightKg] = useState(str(pre?.targetDryWeightKg));
  const [potassiumMmolL, setPotassiumMmolL] = useState(str(pre?.potassiumMmolL));
  const [sodiumProfile, setSodiumProfile] = useState(
    pre?.sodiumProfile != null ? String(pre.sodiumProfile) : ''
  );
  const [ufProfile, setUfProfile] = useState(
    pre?.ufProfile != null ? String(pre.ufProfile) : ''
  );
  const [bloodPressure, setBloodPressure] = useState(pre?.bloodPressure ?? '');
  const [pulse, setPulse] = useState(str(pre?.pulse));
  const [temperature, setTemperature] = useState(str(pre?.temperature));
  const [bloodSugar, setBloodSugar] = useState(str(pre?.bloodSugar));
  const [accessCondition, setAccessCondition] = useState(pre?.accessCondition ?? 'Normal');
  const [primeRinsebackMl, setPrimeRinsebackMl] = useState(str(pre?.primeRinsebackMl));
  const [ivFluidsMl, setIvFluidsMl] = useState(str(pre?.ivFluidsMl));
  const [oralIntakeMl, setOralIntakeMl] = useState(str(pre?.oralIntakeMl));

  const [postWeight, setPostWeight] = useState(str(post?.postWeightKg));
  const [postBp, setPostBp] = useState(post?.postBp ?? '');
  const [postPotassium, setPostPotassium] = useState(str(post?.postPotassiumMmolL));
  const [postBloodSugar, setPostBloodSugar] = useState(str(post?.postBloodSugar));
  const [totalUf, setTotalUf] = useState(str(post?.totalUfRemoved));
  const [condition, setCondition] = useState<'Stable' | 'Unstable'>(
    post?.condition === 'Unstable' ? 'Unstable' : 'Stable'
  );
  const [technicianName, setTechnicianName] = useState(
    post?.technicianName ?? pre?.technicianName ?? ''
  );
  const [nurseName, setNurseName] = useState(post?.nurseName ?? pre?.nurseName ?? '');
  const [doctorName, setDoctorName] = useState(post?.doctorName ?? pre?.doctorName ?? '');

  useEffect(() => {
    if (!open) return;
    setSessionDate(session.sessionDate);
    setHospitalName(session.hospitalName);
    setWeightKg(str(pre?.weightKg));
    setDryWeightKg(str(pre?.targetDryWeightKg));
    setPotassiumMmolL(str(pre?.potassiumMmolL));
    setSodiumProfile(pre?.sodiumProfile != null ? String(pre.sodiumProfile) : '');
    setUfProfile(pre?.ufProfile != null ? String(pre.ufProfile) : '');
    setBloodPressure(pre?.bloodPressure ?? '');
    setPulse(str(pre?.pulse));
    setTemperature(str(pre?.temperature));
    setBloodSugar(str(pre?.bloodSugar));
    setAccessCondition(pre?.accessCondition ?? 'Normal');
    setPrimeRinsebackMl(str(pre?.primeRinsebackMl));
    setIvFluidsMl(str(pre?.ivFluidsMl));
    setOralIntakeMl(str(pre?.oralIntakeMl));
    setPostWeight(str(post?.postWeightKg));
    setPostBp(post?.postBp ?? '');
    setPostPotassium(str(post?.postPotassiumMmolL));
    setPostBloodSugar(str(post?.postBloodSugar));
    setTotalUf(str(post?.totalUfRemoved));
    setCondition(post?.condition === 'Unstable' ? 'Unstable' : 'Stable');
    setTechnicianName(post?.technicianName ?? pre?.technicianName ?? '');
    setNurseName(post?.nurseName ?? pre?.nurseName ?? '');
    setDoctorName(post?.doctorName ?? pre?.doctorName ?? '');
    setError(null);
  }, [open, session, pre, post]);

  const parseNum = (v: string) => {
    if (v.trim() === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        session_date: sessionDate,
        hospital_name: hospitalName.trim(),
        weight_kg: parseNum(weightKg),
        target_dry_weight_kg: parseNum(dryWeightKg),
        potassium_mmol_l: parseNum(potassiumMmolL),
        sodium_profile: sodiumProfile !== '' ? Number(sodiumProfile) : undefined,
        uf_profile: ufProfile !== '' ? Number(ufProfile) : undefined,
        blood_pressure: bloodPressure.trim() || undefined,
        pulse: parseNum(pulse),
        temperature: parseNum(temperature),
        blood_sugar: parseNum(bloodSugar),
        access_condition: accessCondition,
        prime_rinseback_ml: parseNum(primeRinsebackMl),
        iv_fluids_ml: parseNum(ivFluidsMl),
        oral_intake_ml: parseNum(oralIntakeMl),
        technician_name: technicianName.trim() || undefined,
        nurse_name: nurseName.trim() || undefined,
        doctor_name: doctorName.trim() || undefined,
      };

      const hasPost =
        post ||
        postWeight ||
        postBp ||
        postPotassium ||
        postBloodSugar ||
        totalUf ||
        technicianName ||
        nurseName ||
        doctorName;

      if (hasPost) {
        Object.assign(payload, {
          post_weight_kg: parseNum(postWeight),
          post_bp: postBp.trim() || undefined,
          post_potassium_mmol_l: parseNum(postPotassium),
          post_blood_sugar: parseNum(postBloodSugar),
          total_uf_removed: parseNum(totalUf),
          condition,
        });
      }

      await updateSession(session.id, payload);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      setError('Could not save changes. Please check your values and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit session</DialogTitle>
          <DialogDescription>
            Update session details, pre-dialysis, or post-dialysis values. Completed sessions can be
            corrected here if something was entered incorrectly. UF goal recalculates when weight or
            fluid fields change.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pre">Pre-dialysis</TabsTrigger>
            <TabsTrigger value="post">Post-dialysis</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-3 pt-3">
            <div className="space-y-1">
              <Label>Session date</Label>
              <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hospital / dialysis center</Label>
              <Input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="pre" className="grid gap-3 sm:grid-cols-2 pt-3">
            <div className="space-y-1">
              <Label>Pre weight (kg)</Label>
              <Input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Target dry weight (kg)</Label>
              <Input type="number" step="0.1" value={dryWeightKg} onChange={(e) => setDryWeightKg(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Pre K (mmol/L)</Label>
              <Input type="number" step="0.1" value={potassiumMmolL} onChange={(e) => setPotassiumMmolL(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Sodium (0–6)</Label>
              <Select value={sodiumProfile} onValueChange={setSodiumProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select 0–6" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>UF (0–6)</Label>
              <Select value={ufProfile} onValueChange={setUfProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select 0–6" />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Blood pressure</Label>
              <Input value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} placeholder="120/80" />
            </div>
            <div className="space-y-1">
              <Label>Pulse</Label>
              <Input type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Temperature</Label>
              <Input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Glucose / sugar (mg/dL)</Label>
              <Input type="number" value={bloodSugar} onChange={(e) => setBloodSugar(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Access condition</Label>
              <Select value={accessCondition} onValueChange={setAccessCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Abnormal">Abnormal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Prime / rinseback (ml)</Label>
              <Input type="number" value={primeRinsebackMl} onChange={(e) => setPrimeRinsebackMl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>IV fluids (ml)</Label>
              <Input type="number" value={ivFluidsMl} onChange={(e) => setIvFluidsMl(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Oral intake (ml)</Label>
              <Input type="number" value={oralIntakeMl} onChange={(e) => setOralIntakeMl(e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-muted-foreground">Care team</Label>
            </div>
            <div className="space-y-1">
              <Label>Technician name</Label>
              <Input value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Nurse name</Label>
              <Input value={nurseName} onChange={(e) => setNurseName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Doctor name</Label>
              <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
            </div>
          </TabsContent>

          <TabsContent value="post" className="grid gap-3 sm:grid-cols-2 pt-3">
            {!post && !session.postDialysisAssessment && (
              <p className="sm:col-span-2 text-sm text-muted-foreground">
                No post-dialysis record yet. Fill fields below to add one (e.g. if dialysis was ended
                without full data).
              </p>
            )}
            <div className="space-y-1">
              <Label>Post weight (kg)</Label>
              <Input type="number" step="0.1" value={postWeight} onChange={(e) => setPostWeight(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Post BP</Label>
              <Input value={postBp} onChange={(e) => setPostBp(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Post K (mmol/L)</Label>
              <Input type="number" step="0.1" value={postPotassium} onChange={(e) => setPostPotassium(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Post glucose (mg/dL)</Label>
              <Input type="number" value={postBloodSugar} onChange={(e) => setPostBloodSugar(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Total UF removed (L)</Label>
              <Input type="number" step="0.1" value={totalUf} onChange={(e) => setTotalUf(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as 'Stable' | 'Unstable')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stable">Stable</SelectItem>
                  <SelectItem value="Unstable">Unstable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Technician name</Label>
              <Input value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Nurse name</Label>
              <Input value={nurseName} onChange={(e) => setNurseName(e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Doctor name</Label>
              <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
            </div>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
