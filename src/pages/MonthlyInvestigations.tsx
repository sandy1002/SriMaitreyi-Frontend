import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ClipboardList, Loader2, Save, TestTube2 } from 'lucide-react';
import * as api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { LabInvestigationReport, LabInvestigationType } from '@/types';
import { CbpReportCapture } from '@/components/clinical/CbpReportCapture';

export default function MonthlyInvestigations() {
  const { patient, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [catalog, setCatalog] = useState<{ types: LabInvestigationType[]; cbp: LabInvestigationType } | null>(
    null
  );
  const [reports, setReports] = useState<LabInvestigationReport[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [labName, setLabName] = useState('');
  const [notes, setNotes] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const cat = await api.fetchInvestigationsCatalog();
      setCatalog(cat);
      const { reports: list } = await api.fetchLabInvestigations(patient.id);
      setReports(list);
    } catch {
      toast({ title: 'Could not load investigations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [patient?.id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAuthenticated || !patient) {
    return <Navigate to="/login" replace />;
  }

  const typeMeta = catalog?.types.find((t) => t.id === selectedType);

  const resetForm = () => {
    setValues({});
    setLabName('');
    setNotes('');
    setEditingId(null);
    setReportDate(new Date().toISOString().slice(0, 10));
  };

  const loadReportForEdit = (r: LabInvestigationReport) => {
    setSelectedType(r.investigationType);
    setEditingId(r.id);
    setReportDate(r.reportDate);
    setLabName(r.labName ?? '');
    setNotes(r.notes ?? '');
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(r.results)) {
      next[k] = String(v);
    }
    setValues(next);
  };

  const handleSave = async () => {
    if (!selectedType || !typeMeta || selectedType === 'cbp') return;
    setSaving(true);
    try {
      const results: Record<string, number> = {};
      for (const f of typeMeta.fields ?? []) {
        const raw = values[f.key]?.trim();
        if (raw) {
          const n = Number(raw);
          if (Number.isFinite(n)) results[f.key] = n;
        }
      }
      if (editingId) {
        await api.updateLabInvestigation(patient.id, editingId, {
          report_date: reportDate,
          lab_name: labName || undefined,
          notes: notes || undefined,
          results,
        });
        toast({ title: 'Investigation updated' });
      } else {
        await api.saveLabInvestigation(patient.id, {
          investigation_type: selectedType,
          report_date: reportDate,
          lab_name: labName || undefined,
          notes: notes || undefined,
          results,
        });
        toast({ title: 'Investigation saved' });
      }
      await load();
      resetForm();
      setSelectedType(null);
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
              <ClipboardList className="h-5 w-5 text-primary" />
              Monthly investigations
            </CardTitle>
            <CardDescription>
              CBP, lipid profile, and liver function tests. Included in your care summary PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Card
                  className="cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => {
                    resetForm();
                    setSelectedType('cbp');
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <TestTube2 className="h-8 w-8 text-rose-600" />
                    <div>
                      <p className="font-semibold">CBP</p>
                      <p className="text-xs text-muted-foreground">Complete blood picture</p>
                    </div>
                  </CardContent>
                </Card>
                {(catalog?.types ?? []).map((t) => (
                  <Card
                    key={t.id}
                    className="cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => {
                      resetForm();
                      setSelectedType(t.id);
                    }}
                  >
                    <CardContent className="p-4">
                      <p className="font-semibold">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedType === 'cbp' && (
          <CbpReportCapture patientId={patient.id} patientGender={patient.gender} />
        )}

        {selectedType && selectedType !== 'cbp' && typeMeta && (
          <Card>
            <CardHeader>
              <CardTitle>{typeMeta.label}</CardTitle>
              <CardDescription>{typeMeta.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Report date</Label>
                  <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                </div>
                <div>
                  <Label>Lab name</Label>
                  <Input value={labName} onChange={(e) => setLabName(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(typeMeta.fields ?? []).map((f) => (
                  <div key={f.key}>
                    <Label>
                      {f.label} ({f.unit})
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      value={values[f.key] ?? ''}
                      onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {editingId ? 'Update report' : 'Save report'}
                </Button>
                <Button variant="outline" onClick={() => { resetForm(); setSelectedType(null); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved panels (click to edit)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted/50"
                  onClick={() => loadReportForEdit(r)}
                >
                  <span className="font-medium">{r.investigationLabel}</span>
                  <span className="text-muted-foreground"> — {r.reportDate}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
