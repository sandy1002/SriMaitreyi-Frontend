import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { usePatientDiaryPage } from '@/hooks/usePatientDiaryPage';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Save, Syringe, Trash2 } from 'lucide-react';
import * as api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { VaccineDiaryEntry, VaccineDiaryIntakeInput } from '@/types';
import { DOSE_UNITS } from '@/lib/clinicalUnits';

type IntakeRow = {
  key: string;
  intakeId?: string;
  vaccineName: string;
  doseText: string;
  doseUnit: string;
  site: string;
  batchNumber: string;
  administered: 'yes' | 'no';
  administeredAt: string;
  notes: string;
};

const emptyIntake = (): IntakeRow => ({
  key: crypto.randomUUID(),
  vaccineName: '',
  doseText: '',
  doseUnit: '',
  site: '',
  batchNumber: '',
  administered: 'yes',
  administeredAt: '',
  notes: '',
});

export default function VaccineDiaryPage() {
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
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<IntakeRow[]>([emptyIntake()]);
  const [recent, setRecent] = useState<VaccineDiaryEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activePatient?.id) return;
    api.fetchVaccineDiaries(activePatient.id).then(setRecent).catch(console.error);
  }, [activePatient?.id]);

  useEffect(() => {
    const existing = recent.find((d) => d.diaryDate === diaryDate);
    if (!existing) {
      setRows([emptyIntake()]);
      setNotes('');
      return;
    }
    setNotes(existing.notes ?? '');
    setRows(
      existing.intakes.length
        ? existing.intakes.map((i) => ({
            key: crypto.randomUUID(),
            intakeId: i.id,
            vaccineName: i.vaccineName,
            doseText: i.doseText ?? '',
            doseUnit: i.doseUnit ?? '',
            site: i.site ?? '',
            batchNumber: i.batchNumber ?? '',
            administered: i.administered ? 'yes' : 'no',
            administeredAt: i.administeredAt ?? '',
            notes: i.notes ?? '',
          }))
        : [emptyIntake()]
    );
  }, [diaryDate, recent]);

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

  const buildPayload = (): VaccineDiaryIntakeInput[] =>
    rows
      .filter((r) => r.vaccineName.trim())
      .map((r) => ({
        id: r.intakeId || undefined,
        vaccine_name: r.vaccineName.trim(),
        dose_text: r.doseText || undefined,
        dose_unit: r.doseUnit || undefined,
        site: r.site || undefined,
        batch_number: r.batchNumber || undefined,
        administered: r.administered === 'yes',
        administered_at: r.administeredAt || undefined,
        notes: r.notes || undefined,
      }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveVaccineDiary(patient.id, {
        diary_date: diaryDate,
        notes: notes || undefined,
        intakes: buildPayload(),
      });
      toast({ title: 'Vaccine diary saved' });
      setRecent(await api.fetchVaccineDiaries(patient.id));
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
              <Syringe className="h-5 w-5 text-primary" />
              Vaccine diary
              {isTechnician && (
                <span className="text-sm font-normal text-muted-foreground">— {patient.name}</span>
              )}
            </CardTitle>
            <CardDescription>
              Record immunizations for monthly review and care summary PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Label>Date</Label>
              <Input type="date" value={diaryDate} onChange={(e) => setDiaryDate(e.target.value)} />
            </div>

            {rows.map((row, idx) => (
              <Card key={row.key} className="border-dashed">
                <CardContent className="pt-4 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Vaccine name</Label>
                    <Input
                      value={row.vaccineName}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, vaccineName: e.target.value } : r))
                        )
                      }
                      placeholder="e.g. Hepatitis B"
                    />
                  </div>
                  <div>
                    <Label>Dose</Label>
                    <Input
                      value={row.doseText}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, doseText: e.target.value } : r))
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select
                      value={row.doseUnit || 'none'}
                      onValueChange={(v) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, doseUnit: v === 'none' ? '' : v } : r
                          )
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {DOSE_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Site</Label>
                    <Input
                      value={row.site}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, site: e.target.value } : r))
                        )
                      }
                      placeholder="e.g. left deltoid"
                    />
                  </div>
                  <div>
                    <Label>Batch number</Label>
                    <Input
                      value={row.batchNumber}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, batchNumber: e.target.value } : r))
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Given?</Label>
                    <Select
                      value={row.administered}
                      onValueChange={(v) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, administered: v as 'yes' | 'no' } : r
                          )
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      value={row.administeredAt}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, administeredAt: e.target.value } : r))
                        )
                      }
                      placeholder="e.g. 10:30 AM"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={rows.length <= 1}
                      onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={() => setRows((p) => [...p, emptyIntake()])}>
              <Plus className="h-4 w-4 mr-2" />
              Add vaccine
            </Button>

            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving…' : 'Save vaccine diary'}
            </Button>
          </CardContent>
        </Card>

        {recent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent entries</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {recent.slice(0, 7).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="w-full text-left rounded-md border px-3 py-2 hover:bg-muted/50"
                  onClick={() => setDiaryDate(d.diaryDate)}
                >
                  <span className="font-medium">{d.diaryDate}</span>
                  <span className="text-muted-foreground"> — {d.intakes.length} vaccine(s)</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
