import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Building2, Play, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import type { DialysisSession } from '@/types';

export default function NewSession() {
  const { patient, isAuthenticated, user } = useAuth();
  const { createSession } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [hospitalName, setHospitalName] = useState('City General Hospital');
  const [openSession, setOpenSession] = useState<DialysisSession | null>(null);
  const [loadingOpen, setLoadingOpen] = useState(true);

  const [weightKg, setWeightKg] = useState('');
  const [dryWeightKg, setDryWeightKg] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [pulse, setPulse] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [accessCondition, setAccessCondition] = useState<'Normal' | 'Abnormal'>('Normal');
  const [ufGoal, setUfGoal] = useState('');
  const [potassiumMmolL, setPotassiumMmolL] = useState('');
  const [primeMl, setPrimeMl] = useState('250');
  const [ivFluidsMl, setIvFluidsMl] = useState('0');
  const [oralIntakeMl, setOralIntakeMl] = useState('0');
  const [ufCalc, setUfCalc] = useState<{
    idwgKg: number;
    fluidAddedLiters: number;
    ufGoalLiters: number;
  } | null>(null);

  const [previousPostK, setPreviousPostK] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!patient?.id) return;
    setLoadingOpen(true);
    api
      .fetchOpenSession(patient.id)
      .then((s) => {
        setOpenSession(s);
        if (s?.status === 'in-progress') {
          navigate(`/session/${s.id}`, { replace: true });
        }
        if (patient.targetDryWeightKg) {
          setDryWeightKg(String(patient.targetDryWeightKg));
        }
      })
      .finally(() => setLoadingOpen(false));
  }, [patient?.id, navigate, patient?.targetDryWeightKg]);

  const runUfCalc = useCallback(async () => {
    const pre = Number(weightKg);
    const dry = Number(dryWeightKg);
    if (!pre || !dry) {
      setUfCalc(null);
      return;
    }
    try {
      const result = await api.calculateUfGoal({
        pre_weight_kg: pre,
        target_dry_weight_kg: dry,
        prime_rinseback_ml: Number(primeMl) || 250,
        iv_fluids_ml: Number(ivFluidsMl) || 0,
        oral_intake_ml: Number(oralIntakeMl) || 0,
      });
      setUfCalc({
        idwgKg: result.idwgKg,
        fluidAddedLiters: result.fluidAddedLiters,
        ufGoalLiters: result.ufGoalLiters,
      });
      setUfGoal(result.ufGoal);
    } catch {
      setUfCalc(null);
    }
  }, [weightKg, dryWeightKg, primeMl, ivFluidsMl, oralIntakeMl]);

  useEffect(() => {
    const t = setTimeout(runUfCalc, 400);
    return () => clearTimeout(t);
  }, [runUfCalc]);

  if (!isAuthenticated || !patient) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'patient') {
    return <Navigate to="/dashboard" replace />;
  }
  if (loadingOpen) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  const needsPreviousPostK = openSession?.status === 'post-dialysis';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (needsPreviousPostK && !previousPostK) {
      toast({
        title: 'Post K required',
        description: 'Enter Post K for your previous session before starting a new one.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { session, alerts } = await createSession(
        patient.id,
        hospitalName,
        sessionDate,
        {
          weightKg: Number(weightKg),
          bloodPressure,
          pulse: Number(pulse),
          temperature: Number(temperature),
          bloodSugar: Number(bloodSugar),
          accessCondition,
          ufGoal,
          potassiumMmolL: potassiumMmolL ? Number(potassiumMmolL) : undefined,
          targetDryWeightKg: dryWeightKg ? Number(dryWeightKg) : undefined,
          primeRinsebackMl: Number(primeMl) || 250,
          ivFluidsMl: Number(ivFluidsMl) || 0,
          oralIntakeMl: Number(oralIntakeMl) || 0,
          previousSessionPostK: needsPreviousPostK ? Number(previousPostK) : undefined,
        }
      );

      toast({
        title: 'Session Started',
        description:
          alerts.length > 0
            ? `Session created. ${alerts.length} alert(s) flagged for review.`
            : 'Your dialysis session has been created successfully.',
      });
      navigate(`/session/${session.id}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create session.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-clinical-lg animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-glow mb-4">
              <Play className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Start New Session</CardTitle>
            <CardDescription>Begin recording your dialysis session</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {needsPreviousPostK && openSession && (
                <Card className="border-amber-500/40 bg-amber-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Previous session — Post K</CardTitle>
                    <CardDescription>
                      Session from {openSession.sessionDate} is open until Post K is recorded.
                      Enter Post K before starting today&apos;s session.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="prevPostK">Potassium — Post K (mmol/L)</Label>
                    <Input
                      id="prevPostK"
                      type="number"
                      step="0.1"
                      className="mt-2"
                      value={previousPostK}
                      onChange={(e) => setPreviousPostK(e.target.value)}
                      placeholder="e.g. 4.2"
                      required
                    />
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Session Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Hospital / Dialysis Center
                </Label>
                <Input
                  id="hospital"
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                />
              </div>

              <CardTitle className="pt-2 text-lg">PRE-DIALYSIS ASSESSMENT</CardTitle>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Pre weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    required
                    min={0}
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dryWeight">Target dry weight (kg)</Label>
                  <Input
                    id="dryWeight"
                    type="number"
                    value={dryWeightKg}
                    onChange={(e) => setDryWeightKg(e.target.value)}
                    required
                    min={0}
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="potassium">Potassium — Pre K (mmol/L)</Label>
                  <Input
                    id="potassium"
                    type="number"
                    step="0.1"
                    value={potassiumMmolL}
                    onChange={(e) => setPotassiumMmolL(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodPressure">Blood Pressure</Label>
                  <Input
                    id="bloodPressure"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pulse">Pulse</Label>
                  <Input id="pulse" type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodSugar">Blood Sugar</Label>
                  <Input
                    id="bloodSugar"
                    type="number"
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessCondition">Access Condition</Label>
                  <select
                    id="accessCondition"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                    value={accessCondition}
                    onChange={(e) => setAccessCondition(e.target.value as 'Normal' | 'Abnormal')}
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
              </div>

              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                UF goal (automated)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Step 1: IDWG = pre weight − dry weight. Step 2: add prime/IV/oral fluids. Step 3: total UF goal.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="prime">Prime / rinseback (ml)</Label>
                  <Input id="prime" type="number" value={primeMl} onChange={(e) => setPrimeMl(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iv">IV fluids (ml)</Label>
                  <Input id="iv" type="number" value={ivFluidsMl} onChange={(e) => setIvFluidsMl(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oral">Oral during session (ml)</Label>
                  <Input id="oral" type="number" value={oralIntakeMl} onChange={(e) => setOralIntakeMl(e.target.value)} />
                </div>
              </div>
              {ufCalc && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">IDWG:</span>{' '}
                    <strong>{ufCalc.idwgKg} kg</strong> (≈ L fluid gained)
                  </p>
                  <p>
                    <span className="text-muted-foreground">Fluids during treatment:</span>{' '}
                    <strong>{ufCalc.fluidAddedLiters} L</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">UF goal:</span>{' '}
                    <strong>{ufCalc.ufGoalLiters} L</strong>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="ufGoal">UF goal (saved)</Label>
                <Input id="ufGoal" value={ufGoal} onChange={(e) => setUfGoal(e.target.value)} required />
              </div>

              <div className="pt-4 space-y-3">
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Start Session'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
