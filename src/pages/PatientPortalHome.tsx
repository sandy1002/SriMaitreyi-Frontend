import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Activity,
  Brain,
  FileHeart,
  HeartPulse,
  LogOut,
  Pill,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLogo } from '@/components/layout/AppLogo';
import { useToast } from '@/hooks/use-toast';
import {
  createHealthHeadache,
  createHealthMedication,
  createHealthRecord,
  createHealthVital,
  deleteHealthHeadache,
  deleteHealthMedication,
  deleteHealthRecord,
  deleteHealthVital,
  fetchHealthDashboard,
  fetchHealthHeadaches,
  fetchHealthMedications,
  fetchHealthRecords,
  fetchHealthVitals,
  updateHealthProfile,
  type HealthCondition,
} from '@/services/api';

const HEALTH_PATIENT_KEY = 'srimae_health_patient';

type HealthPatient = {
  id: string;
  username: string;
  displayName: string;
  email?: string;
};

type TabId = 'overview' | 'conditions' | 'medications' | 'headache' | 'vitals' | 'records';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PatientPortalHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<HealthPatient | null>(null);
  const [tab, setTab] = useState<TabId>('overview');
  const [catalog, setCatalog] = useState<HealthCondition[]>([]);
  const [focusConditions, setFocusConditions] = useState<string[]>([]);
  const [counts, setCounts] = useState({
    medications: 0,
    headacheEntries: 0,
    vitalReadings: 0,
    healthRecords: 0,
  });
  const [medications, setMedications] = useState<Record<string, unknown>[]>([]);
  const [headaches, setHeadaches] = useState<Record<string, unknown>[]>([]);
  const [vitals, setVitals] = useState<Record<string, unknown>[]>([]);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  // forms
  const [medForm, setMedForm] = useState({
    name: '',
    dose: '',
    frequency: '',
    conditionTag: 'migraine',
    purpose: '',
  });
  const [headacheForm, setHeadacheForm] = useState({
    entryDate: todayStr(),
    entryTime: '',
    intensity: '5',
    durationMinutes: '',
    location: '',
    headacheType: 'migraine',
    triggers: '',
    symptoms: '',
    medicationTaken: '',
    reliefScore: '',
    notes: '',
  });
  const [vitalForm, setVitalForm] = useState({
    recordedAt: nowLocal(),
    systolicBp: '',
    diastolicBp: '',
    pulse: '',
    weightKg: '',
    bloodGlucoseMgDl: '',
    notes: '',
  });
  const [recordForm, setRecordForm] = useState({
    recordDate: todayStr(),
    recordType: 'checkup',
    title: '',
    conditionTag: 'general',
    body: '',
    providerName: '',
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HEALTH_PATIENT_KEY);
      if (!raw) {
        navigate('/patient-portal', { replace: true });
        return;
      }
      setPatient(JSON.parse(raw) as HealthPatient);
    } catch {
      navigate('/patient-portal', { replace: true });
    }
  }, [navigate]);

  const loadAll = useCallback(async (patientId: string) => {
    setLoading(true);
    try {
      const dash = await fetchHealthDashboard(patientId);
      setCatalog(dash.conditionCatalog);
      setFocusConditions(dash.profile.focusConditions ?? []);
      setCounts(dash.counts);
      const [m, h, v, r] = await Promise.all([
        fetchHealthMedications(patientId),
        fetchHealthHeadaches(patientId),
        fetchHealthVitals(patientId),
        fetchHealthRecords(patientId),
      ]);
      setMedications(m);
      setHeadaches(h);
      setVitals(v);
      setRecords(r);
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to load portal data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (patient?.id) loadAll(patient.id);
  }, [patient?.id, loadAll]);

  const trackingMigraine = useMemo(
    () => focusConditions.includes('migraine') || focusConditions.length === 0,
    [focusConditions]
  );

  const logout = () => {
    try {
      sessionStorage.removeItem(HEALTH_PATIENT_KEY);
    } catch {
      /* ignore */
    }
    navigate('/patient-portal');
  };

  const toggleCondition = (id: string) => {
    setFocusConditions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveConditions = async () => {
    if (!patient) return;
    try {
      await updateHealthProfile(patient.id, { focusConditions });
      toast({ title: 'Health focus updated' });
      await loadAll(patient.id);
    } catch (e) {
      toast({
        title: 'Could not save',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    }
  };

  const addMed = async () => {
    if (!patient || !medForm.name.trim()) return;
    try {
      await createHealthMedication(patient.id, medForm);
      setMedForm({ name: '', dose: '', frequency: '', conditionTag: 'migraine', purpose: '' });
      toast({ title: 'Medication added' });
      await loadAll(patient.id);
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    }
  };

  const addHeadache = async () => {
    if (!patient) return;
    try {
      await createHealthHeadache(patient.id, {
        entryDate: headacheForm.entryDate,
        entryTime: headacheForm.entryTime || undefined,
        intensity: headacheForm.intensity ? Number(headacheForm.intensity) : undefined,
        durationMinutes: headacheForm.durationMinutes
          ? Number(headacheForm.durationMinutes)
          : undefined,
        location: headacheForm.location || undefined,
        headacheType: headacheForm.headacheType || undefined,
        triggers: headacheForm.triggers
          ? headacheForm.triggers.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        symptoms: headacheForm.symptoms
          ? headacheForm.symptoms.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        medicationTaken: headacheForm.medicationTaken || undefined,
        reliefScore: headacheForm.reliefScore ? Number(headacheForm.reliefScore) : undefined,
        notes: headacheForm.notes || undefined,
      });
      setHeadacheForm((f) => ({
        ...f,
        intensity: '5',
        durationMinutes: '',
        location: '',
        triggers: '',
        symptoms: '',
        medicationTaken: '',
        reliefScore: '',
        notes: '',
      }));
      toast({ title: 'Headache entry saved' });
      await loadAll(patient.id);
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    }
  };

  const addVital = async () => {
    if (!patient) return;
    try {
      await createHealthVital(patient.id, {
        recordedAt: vitalForm.recordedAt,
        systolicBp: vitalForm.systolicBp ? Number(vitalForm.systolicBp) : undefined,
        diastolicBp: vitalForm.diastolicBp ? Number(vitalForm.diastolicBp) : undefined,
        pulse: vitalForm.pulse ? Number(vitalForm.pulse) : undefined,
        weightKg: vitalForm.weightKg ? Number(vitalForm.weightKg) : undefined,
        bloodGlucoseMgDl: vitalForm.bloodGlucoseMgDl
          ? Number(vitalForm.bloodGlucoseMgDl)
          : undefined,
        notes: vitalForm.notes || undefined,
      });
      setVitalForm({
        recordedAt: nowLocal(),
        systolicBp: '',
        diastolicBp: '',
        pulse: '',
        weightKg: '',
        bloodGlucoseMgDl: '',
        notes: '',
      });
      toast({ title: 'Vitals saved' });
      await loadAll(patient.id);
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    }
  };

  const addRecord = async () => {
    if (!patient || !recordForm.title.trim()) return;
    try {
      await createHealthRecord(patient.id, recordForm);
      setRecordForm({
        recordDate: todayStr(),
        recordType: 'checkup',
        title: '',
        conditionTag: 'general',
        body: '',
        providerName: '',
      });
      toast({ title: 'Health record added' });
      await loadAll(patient.id);
    } catch (e) {
      toast({ title: 'Failed', description: e instanceof Error ? e.message : undefined, variant: 'destructive' });
    }
  };

  if (!patient) return null;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <HeartPulse className="w-4 h-4" /> },
    { id: 'conditions', label: 'My conditions', icon: <Brain className="w-4 h-4" /> },
    { id: 'medications', label: 'Medications', icon: <Pill className="w-4 h-4" /> },
    { id: 'headache', label: 'Headache diary', icon: <Brain className="w-4 h-4" /> },
    { id: 'vitals', label: 'BP & vitals', icon: <Activity className="w-4 h-4" /> },
    { id: 'records', label: 'Health records', icon: <FileHeart className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Helmet>
        <title>Patient Portal — Srimae</title>
      </Helmet>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <div>
              <p
                className="text-sm font-semibold ombre-text"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                Patient Portal
              </p>
              <p className="text-xs text-muted-foreground">{patient.displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => loadAll(patient.id)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">Site</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-5xl space-y-6">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold ombre-text mb-1"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            Hi, {patient.displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            General health tracking for everyday conditions — migraine, BP, medications, checkup
            notes, and more. Not connected to the Dialysis App.
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Medications', value: counts.medications, tab: 'medications' as TabId },
                { label: 'Headache entries', value: counts.headacheEntries, tab: 'headache' as TabId },
                { label: 'Vital readings', value: counts.vitalReadings, tab: 'vitals' as TabId },
                { label: 'Health records', value: counts.healthRecords, tab: 'records' as TabId },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setTab(c.tab)}
                  className="rounded-xl border bg-card p-4 text-left hover:shadow-md transition-shadow"
                >
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </button>
              ))}
            </div>
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <p className="font-semibold text-sm">Conditions you are tracking</p>
              <div className="flex flex-wrap gap-2">
                {focusConditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    None selected yet — open <button type="button" className="underline" onClick={() => setTab('conditions')}>My conditions</button> to choose (e.g. Migraine, High BP).
                  </p>
                ) : (
                  focusConditions.map((id) => (
                    <Badge key={id} variant="secondary" className="capitalize">
                      {catalog.find((c) => c.id === id)?.label ?? id}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'conditions' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pick the common health problems you want tools for. Modules adapt around migraine
              diary, BP vitals, meds, and records.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {catalog.map((c) => (
                <label
                  key={c.id}
                  className={`flex gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    focusConditions.includes(c.id) ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <Checkbox
                    checked={focusConditions.includes(c.id)}
                    onCheckedChange={() => toggleCondition(c.id)}
                  />
                  <div>
                    <p className="font-semibold text-sm">{c.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <Button onClick={saveConditions} className="ombre-btn border-0">
              Save conditions
            </Button>
          </div>
        )}

        {tab === 'medications' && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label>Medicine name *</Label>
                <Input
                  value={medForm.name}
                  onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sumatriptan"
                />
              </div>
              <div className="space-y-1">
                <Label>Dose</Label>
                <Input
                  value={medForm.dose}
                  onChange={(e) => setMedForm((f) => ({ ...f, dose: e.target.value }))}
                  placeholder="50 mg"
                />
              </div>
              <div className="space-y-1">
                <Label>Frequency</Label>
                <Input
                  value={medForm.frequency}
                  onChange={(e) => setMedForm((f) => ({ ...f, frequency: e.target.value }))}
                  placeholder="As needed / once daily"
                />
              </div>
              <div className="space-y-1">
                <Label>For condition</Label>
                <Select
                  value={medForm.conditionTag}
                  onValueChange={(v) => setMedForm((f) => ({ ...f, conditionTag: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Purpose</Label>
                <Input
                  value={medForm.purpose}
                  onChange={(e) => setMedForm((f) => ({ ...f, purpose: e.target.value }))}
                  placeholder="Abortive / preventive"
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={addMed}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add medication
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {medications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No medications yet.</p>
              ) : (
                medications.map((m) => (
                  <div
                    key={String(m.id)}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{String(m.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        {[m.dose, m.frequency, m.conditionTag, m.purpose]
                          .filter(Boolean)
                          .map(String)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await deleteHealthMedication(patient.id, String(m.id));
                        await loadAll(patient.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'headache' && (
          <div className="space-y-4">
            {!trackingMigraine && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Tip: add <strong>Migraine / Headache</strong> under My conditions for a focused
                migraine setup.
              </p>
            )}
            <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={headacheForm.entryDate}
                  onChange={(e) => setHeadacheForm((f) => ({ ...f, entryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={headacheForm.entryTime}
                  onChange={(e) => setHeadacheForm((f) => ({ ...f, entryTime: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Intensity (1–10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={headacheForm.intensity}
                  onChange={(e) => setHeadacheForm((f) => ({ ...f, intensity: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={headacheForm.durationMinutes}
                  onChange={(e) =>
                    setHeadacheForm((f) => ({ ...f, durationMinutes: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={headacheForm.headacheType}
                  onValueChange={(v) => setHeadacheForm((f) => ({ ...f, headacheType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="migraine">Migraine</SelectItem>
                    <SelectItem value="tension">Tension</SelectItem>
                    <SelectItem value="cluster">Cluster</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Location</Label>
                <Input
                  value={headacheForm.location}
                  onChange={(e) => setHeadacheForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Left / right / frontal"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Triggers (comma-separated)</Label>
                <Input
                  value={headacheForm.triggers}
                  onChange={(e) => setHeadacheForm((f) => ({ ...f, triggers: e.target.value }))}
                  placeholder="stress, lack of sleep, screen time"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Symptoms (comma-separated)</Label>
                <Input
                  value={headacheForm.symptoms}
                  onChange={(e) => setHeadacheForm((f) => ({ ...f, symptoms: e.target.value }))}
                  placeholder="nausea, light sensitivity"
                />
              </div>
              <div className="space-y-1">
                <Label>Medicine taken</Label>
                <Input
                  value={headacheForm.medicationTaken}
                  onChange={(e) =>
                    setHeadacheForm((f) => ({ ...f, medicationTaken: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Relief after (0–10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={headacheForm.reliefScore}
                  onChange={(e) => setHeadacheForm((f) => ({ ...f, reliefScore: e.target.value }))}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  rows={2}
                  value={headacheForm.notes}
                  onChange={(e) => setHeadacheForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={addHeadache}>
                  <Plus className="w-4 h-4 mr-1" />
                  Log headache
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {headaches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No diary entries yet.</p>
              ) : (
                headaches.map((h) => (
                  <div
                    key={String(h.id)}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {String(h.entryDate)}
                        {h.entryTime ? ` · ${String(h.entryTime)}` : ''}
                        {h.intensity != null ? ` · intensity ${String(h.intensity)}/10` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[h.headacheType, h.location, h.medicationTaken]
                          .filter(Boolean)
                          .map(String)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await deleteHealthHeadache(patient.id, String(h.id));
                        await loadAll(patient.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'vitals' && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-3">
                <Label>Recorded at *</Label>
                <Input
                  type="datetime-local"
                  value={vitalForm.recordedAt}
                  onChange={(e) => setVitalForm((f) => ({ ...f, recordedAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Systolic BP</Label>
                <Input
                  type="number"
                  value={vitalForm.systolicBp}
                  onChange={(e) => setVitalForm((f) => ({ ...f, systolicBp: e.target.value }))}
                  placeholder="120"
                />
              </div>
              <div className="space-y-1">
                <Label>Diastolic BP</Label>
                <Input
                  type="number"
                  value={vitalForm.diastolicBp}
                  onChange={(e) => setVitalForm((f) => ({ ...f, diastolicBp: e.target.value }))}
                  placeholder="80"
                />
              </div>
              <div className="space-y-1">
                <Label>Pulse</Label>
                <Input
                  type="number"
                  value={vitalForm.pulse}
                  onChange={(e) => setVitalForm((f) => ({ ...f, pulse: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={vitalForm.weightKg}
                  onChange={(e) => setVitalForm((f) => ({ ...f, weightKg: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Blood glucose (mg/dL)</Label>
                <Input
                  type="number"
                  value={vitalForm.bloodGlucoseMgDl}
                  onChange={(e) =>
                    setVitalForm((f) => ({ ...f, bloodGlucoseMgDl: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <Label>Notes</Label>
                <Input
                  value={vitalForm.notes}
                  onChange={(e) => setVitalForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-3">
                <Button onClick={addVital}>
                  <Plus className="w-4 h-4 mr-1" />
                  Save vitals
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {vitals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No vitals logged yet.</p>
              ) : (
                vitals.map((v) => (
                  <div
                    key={String(v.id)}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{String(v.recordedAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          v.systolicBp != null && v.diastolicBp != null
                            ? `BP ${v.systolicBp}/${v.diastolicBp}`
                            : null,
                          v.pulse != null ? `Pulse ${v.pulse}` : null,
                          v.weightKg != null ? `Wt ${v.weightKg} kg` : null,
                          v.bloodGlucoseMgDl != null ? `Glucose ${v.bloodGlucoseMgDl}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await deleteHealthVital(patient.id, String(v.id));
                        await loadAll(patient.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'records' && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={recordForm.recordDate}
                  onChange={(e) => setRecordForm((f) => ({ ...f, recordDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={recordForm.recordType}
                  onValueChange={(v) => setRecordForm((f) => ({ ...f, recordType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="checkup">Checkup</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="imaging">Imaging</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Title *</Label>
                <Input
                  value={recordForm.title}
                  onChange={(e) => setRecordForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Annual checkup / MRI report summary"
                />
              </div>
              <div className="space-y-1">
                <Label>Related condition</Label>
                <Select
                  value={recordForm.conditionTag}
                  onValueChange={(v) => setRecordForm((f) => ({ ...f, conditionTag: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {catalog.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Provider</Label>
                <Input
                  value={recordForm.providerName}
                  onChange={(e) => setRecordForm((f) => ({ ...f, providerName: e.target.value }))}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Details</Label>
                <Textarea
                  rows={3}
                  value={recordForm.body}
                  onChange={(e) => setRecordForm((f) => ({ ...f, body: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={addRecord}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add record
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {records.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No health records yet.</p>
              ) : (
                records.map((r) => (
                  <div
                    key={String(r.id)}
                    className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{String(r.title)}</p>
                      <p className="text-xs text-muted-foreground">
                        {String(r.recordDate)} · {String(r.recordType)}
                        {r.providerName ? ` · ${String(r.providerName)}` : ''}
                      </p>
                      {r.body ? (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {String(r.body)}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await deleteHealthRecord(patient.id, String(r.id));
                        await loadAll(patient.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
