import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, Navigate, useParams } from 'react-router-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Play,
  Calculator,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import { formatUfGoal } from '@/lib/clinicalUnits';
import { UfGoalFormulaHint } from '@/components/clinical/UfGoalFormulaHint';
import { InterdialyticSessionSummary } from '@/components/clinical/InterdialyticSessionSummary';
import { nowISTClock } from '@/lib/datetime';
import type {
  DialysisSession,
  InterdialyticFluidsSummary,
  Patient,
  SessionStartDefaults,
} from '@/types';

export default function NewSession() {
  const { patient: authPatient, patients, isAuthenticated, user, isStaff } = useAuth();
  const staffDisplayName = user?.name?.trim() || '';
  const { patientId: routePatientId } = useParams<{ patientId?: string }>();
  const { createSession } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isTechnicianStart = user?.role === 'technician' && !!routePatientId;
  const isPatientStart = user?.role === 'patient';

  const activePatient: Patient | null = useMemo(() => {
    if (isPatientStart && authPatient) return authPatient;
    if (isTechnicianStart && routePatientId) {
      return patients.find((p) => p.id === routePatientId) ?? null;
    }
    return null;
  }, [isPatientStart, isTechnicianStart, authPatient, routePatientId, patients]);

  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [hospitalName, setHospitalName] = useState('');
  const [openSession, setOpenSession] = useState<DialysisSession | null>(null);
  const [loadingOpen, setLoadingOpen] = useState(true);
  const [inProgressWarningOpen, setInProgressWarningOpen] = useState(false);
  const [assessmentRecordedAt, setAssessmentRecordedAt] = useState(() => nowISTClock());
  const [sessionDefaults, setSessionDefaults] = useState<SessionStartDefaults | null>(null);

  const [weightKg, setWeightKg] = useState('');
  const [dryWeightKg, setDryWeightKg] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [pulse, setPulse] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [accessCondition, setAccessCondition] = useState<'Normal' | 'Abnormal'>('Normal');
  const [ufGoal, setUfGoal] = useState('');
  const [potassiumMmolL, setPotassiumMmolL] = useState('');
  const [sodiumProfile, setSodiumProfile] = useState('');
  const [ufProfile, setUfProfile] = useState('');
  const [primeMl, setPrimeMl] = useState('250');
  const [ivFluidsMl, setIvFluidsMl] = useState('0');
  const [oralIntakeMl, setOralIntakeMl] = useState('450');
  const [technicianName, setTechnicianName] = useState('');
  const [nurseName, setNurseName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [ufCalc, setUfCalc] = useState<{
    idwgKg: number;
    fluidAddedLiters: number;
    ufGoalLiters: number;
  } | null>(null);

  const [interdialyticFluids, setInterdialyticFluids] =
    useState<InterdialyticFluidsSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applySessionDefaults = useCallback((defaults: SessionStartDefaults) => {
    setSessionDefaults(defaults);
    if (defaults.hospitalName) setHospitalName(defaults.hospitalName);
    setPrimeMl(String(defaults.suggestedPrimeRinsebackMl ?? 250));
    setIvFluidsMl(String(defaults.suggestedIvFluidsMl ?? 0));
    setOralIntakeMl(String(defaults.suggestedOralIntakeMl ?? 450));
    if (defaults.interdialyticFluids) {
      setInterdialyticFluids(defaults.interdialyticFluids);
    }
  }, []);

  useEffect(() => {
    if (!activePatient?.id) return;
    setLoadingOpen(true);
    Promise.all([
      api.fetchOpenSession(activePatient.id),
      api.fetchSessionDefaults(activePatient.id, sessionDate),
    ])
      .then(([s, defaults]) => {
        setOpenSession(s);
        setInProgressWarningOpen(s?.status === 'in-progress');
        applySessionDefaults(defaults);
        if (activePatient.targetDryWeightKg) {
          setDryWeightKg(String(activePatient.targetDryWeightKg));
        }
      })
      .finally(() => setLoadingOpen(false));
  }, [activePatient?.id, activePatient?.targetDryWeightKg, sessionDate, applySessionDefaults]);

  useEffect(() => {
    const tick = setInterval(() => setAssessmentRecordedAt(nowISTClock()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (isTechnicianStart && staffDisplayName && !technicianName) {
      setTechnicianName(staffDisplayName);
    }
  }, [isTechnicianStart, staffDisplayName, technicianName]);

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

  useEffect(() => {
    if (!activePatient?.id || !sessionDate) return;
    api
      .fetchSessionDefaults(activePatient.id, sessionDate)
      .then((defaults) => {
        if (defaults.interdialyticFluids) setInterdialyticFluids(defaults.interdialyticFluids);
        setSessionDefaults((prev) => ({ ...defaults, hospitalName: prev?.hospitalName ?? defaults.hospitalName }));
      })
      .catch(() => setInterdialyticFluids(null));
  }, [activePatient?.id, sessionDate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isPatientStart && !isTechnicianStart) {
    return <Navigate to={isStaff ? '/staff' : '/dashboard'} replace />;
  }
  if (!activePatient) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 text-center text-muted-foreground">
          Patient not found. Return to the staff dashboard and select a valid patient.
          <Button className="mt-4" variant="outline" onClick={() => navigate('/staff')}>
            Staff dashboard
          </Button>
        </main>
      </div>
    );
  }

  const patient = activePatient;
  const backPath = isTechnicianStart ? '/staff' : '/dashboard';
  if (loadingOpen) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 text-center text-muted-foreground">Loading...</main>
      </div>
    );
  }

  const hasInProgressSession = openSession?.status === 'in-progress';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (hasInProgressSession) {
      setInProgressWarningOpen(true);
      return;
    }
    if (!dryWeightKg) {
      toast({
        title: 'Target dry weight required',
        description: 'Enter target dry weight (kg) before starting the session.',
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
          weightKg: weightKg ? Number(weightKg) : undefined,
          bloodPressure: bloodPressure || undefined,
          pulse: pulse ? Number(pulse) : undefined,
          temperature: temperature ? Number(temperature) : undefined,
          bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
          accessCondition: accessCondition || undefined,
          ufGoal: ufGoal || undefined,
          potassiumMmolL: potassiumMmolL ? Number(potassiumMmolL) : undefined,
          sodiumProfile: sodiumProfile !== '' ? Number(sodiumProfile) : undefined,
          ufProfile: ufProfile !== '' ? Number(ufProfile) : undefined,
          targetDryWeightKg: Number(dryWeightKg),
          primeRinsebackMl: Number(primeMl) || 250,
          ivFluidsMl: Number(ivFluidsMl) || 0,
          oralIntakeMl: Number(oralIntakeMl) || 0,
          technicianName: technicianName.trim() || undefined,
          nurseName: nurseName.trim() || undefined,
          doctorName: doctorName.trim() || undefined,
        }
      );

      toast({
        title: 'Session Started',
        description:
          alerts.length > 0
            ? `Session created. ${alerts.length} alert(s) flagged for review.`
            : 'Your dialysis session has been created successfully.',
      });
      navigate(`/session/${session.id}`, { replace: true });
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
        <Button variant="ghost" className="mb-4" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isTechnicianStart ? 'Back to staff workspace' : 'Back to Dashboard'}
        </Button>

        <Card className="shadow-clinical-lg animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-glow mb-4">
              <Play className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {isTechnicianStart ? `Start session — ${patient.name}` : 'Start New Session'}
            </CardTitle>
            <CardDescription>
              {isTechnicianStart
                ? 'Record pre-dialysis assessment on behalf of the patient (IST timestamps).'
                : 'Begin recording your dialysis session'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {hasInProgressSession && openSession && (
              <Card className="mb-6 border-destructive/40 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Session already in progress
                  </CardTitle>
                  <CardDescription>
                    Close your current dialysis session (End Dialysis) before starting a new one.
                    You can open the in-progress session to continue recording vitals.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => navigate(`/session/${openSession.id}`)}
                  >
                    Open in-progress session
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(backPath)}
                  >
                    Back
                  </Button>
                </CardContent>
              </Card>
            )}

            <AlertDialog open={inProgressWarningOpen} onOpenChange={setInProgressWarningOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close previous session first</AlertDialogTitle>
                  <AlertDialogDescription>
                    A dialysis session from {openSession?.sessionDate} is still in progress at{' '}
                    {openSession?.hospitalName}. End that session before starting a new one, or
                    continue the open session.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay here</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => openSession && navigate(`/session/${openSession.id}`)}
                  >
                    Open in-progress session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <form onSubmit={handleSubmit} className="space-y-6">
              <fieldset disabled={hasInProgressSession} className="space-y-6 disabled:opacity-60">
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

              {sessionDefaults?.previousSessionPostWeight && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Previous session — Post-dialysis weight</CardTitle>
                    <CardDescription>
                      From session on {sessionDefaults.previousSessionPostWeight.sessionDate}
                      {sessionDefaults.previousSessionPostWeight.hospitalName
                        ? ` at ${sessionDefaults.previousSessionPostWeight.hospitalName}`
                        : ''}
                      . Use when comparing today&apos;s pre weight.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold tabular-nums">
                      {sessionDefaults.previousSessionPostWeight.postWeightKg} kg
                    </p>
                  </CardContent>
                </Card>
              )}

              {(interdialyticFluids || sessionDefaults?.interdialyticNutritionPotassium) && (
                <InterdialyticSessionSummary
                  fluids={interdialyticFluids}
                  potassium={sessionDefaults?.interdialyticNutritionPotassium ?? null}
                  sessionDate={sessionDate}
                  compact
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="assessmentTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Assessment date &amp; time (IST, auto)
                </Label>
                <Input
                  id="assessmentTime"
                  readOnly
                  className="bg-muted/50"
                  value={assessmentRecordedAt}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Pre weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    min={0}
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dryWeight">Target dry weight (kg) *</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pulse">Pulse</Label>
                  <Input id="pulse" type="number" value={pulse} onChange={(e) => setPulse(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodSugar">Glucose / Sugar (mg/dL)</Label>
                  <Input
                    id="bloodSugar"
                    type="number"
                    step="1"
                    min={0}
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="e.g. 110"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessCondition">Access Condition</Label>
                  <select
                    id="accessCondition"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                    value={accessCondition}
                    onChange={(e) => setAccessCondition(e.target.value as 'Normal' | 'Abnormal')}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
              </div>

              <CardTitle className="text-base pt-2">Care team</CardTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="technicianName">Technician name</Label>
                  <Input
                    id="technicianName"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="Technician on duty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nurseName">Nurse name</Label>
                  <Input
                    id="nurseName"
                    value={nurseName}
                    onChange={(e) => setNurseName(e.target.value)}
                    placeholder="Nurse on duty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor name</Label>
                  <Input
                    id="doctorName"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Nephrologist / doctor"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    UF goal (automated)
                    <UfGoalFormulaHint />
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Values update as you enter weight and fluids. Oral and IV are fluids given during
                    this dialysis run only (not interdialytic diary totals). Use the help icon for the
                    formula.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 sm:min-w-[280px]">
                  <div className="space-y-2">
                    <Label htmlFor="sodiumProfile">Sodium (0–6)</Label>
                    <Select value={sodiumProfile} onValueChange={setSodiumProfile}>
                      <SelectTrigger id="sodiumProfile">
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
                  <div className="space-y-2">
                    <Label htmlFor="ufProfile">UF (0–6)</Label>
                    <Select value={ufProfile} onValueChange={setUfProfile}>
                      <SelectTrigger id="ufProfile">
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
                </div>
              </div>
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
                <Input
                  id="ufGoal"
                  value={ufGoal}
                  onChange={(e) => setUfGoal(e.target.value)}
                  placeholder={ufCalc ? `${ufCalc.ufGoalLiters} L` : 'e.g. 2.50 L'}
                />
                {ufCalc && (
                  <p className="text-xs text-muted-foreground">
                    Calculated: {formatUfGoal({
                      ufGoalLiters: ufCalc.ufGoalLiters,
                      idwgKg: ufCalc.idwgKg,
                      fluidAddedLiters: ufCalc.fluidAddedLiters,
                    })}
                  </p>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || hasInProgressSession}>
                  {isSubmitting ? 'Creating...' : 'Start Session'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate(backPath)}>
                  Cancel
                </Button>
              </div>
              </fieldset>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
