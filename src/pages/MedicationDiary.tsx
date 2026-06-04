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
import { ArrowLeft, Pill, Plus, Save, Trash2 } from 'lucide-react';
import * as api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { DiaryEntryViewDialog } from '@/components/clinical/DiaryEntryViewDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DOSE_UNITS, formatDose } from '@/lib/clinicalUnits';
import type { MedicationDiaryEntry, MedicationDiaryIntakeInput, Medicine } from '@/types';

type IntakeRow = {
  key: string;
  intakeId?: string;
  medicineId: string;
  medicineName: string;
  doseText: string;
  doseUnit: string;
  route: string;
  taken: 'yes' | 'no';
  takenTime: string;
  notes: string;
};

const emptyIntake = (): IntakeRow => ({
  key: crypto.randomUUID(),
  medicineId: '',
  medicineName: '',
  doseText: '',
  doseUnit: '',
  route: '',
  taken: 'yes',
  takenTime: '',
  notes: '',
});

export default function MedicationDiaryPage() {
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
  const [recent, setRecent] = useState<MedicationDiaryEntry[]>([]);
  const [previewEntry, setPreviewEntry] = useState<MedicationDiaryEntry | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activePatient?.id) return;
    api.fetchMedicationDiaries(activePatient.id).then(setRecent).catch(console.error);
    api.fetchMedicines().then(setMedicines).catch(console.error);
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
            medicineId: i.medicineId ?? '',
            medicineName: i.medicineName ?? '',
            doseText: i.doseText ?? '',
            doseUnit: i.doseUnit ?? '',
            route: i.route ?? '',
            taken: i.taken ? 'yes' : 'no',
            takenTime: i.takenTime ?? '',
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

  const buildPayload = (): MedicationDiaryIntakeInput[] =>
    rows
      .filter((r) => r.medicineId || r.medicineName || r.doseText || r.notes)
      .map((r) => ({
        id: r.intakeId || undefined,
        medicine_id: r.medicineId || undefined,
        medicine_name: r.medicineName || undefined,
        dose_text: r.doseText || undefined,
        dose_unit: r.doseUnit || undefined,
        route: r.route || undefined,
        taken: r.taken === 'yes',
        taken_time: r.takenTime || undefined,
        notes: r.notes || undefined,
      }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveMedicationDiary(patient.id, {
        diary_date: diaryDate,
        notes: notes || undefined,
        intakes: buildPayload(),
      });
      toast({ title: 'Medication diary saved' });
      const list = await api.fetchMedicationDiaries(patient.id);
      setRecent(list);
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
              <Pill className="h-5 w-5 text-primary" />
              Medication diary
              {isTechnician && (
                <span className="text-sm font-normal text-muted-foreground">— {patient.name}</span>
              )}
            </CardTitle>
            <CardDescription>
              Daily medication intake log for overall summary and adherence review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-xs">
              <Label htmlFor="medDiaryDate">Date</Label>
              <Input
                id="medDiaryDate"
                type="date"
                value={diaryDate}
                onChange={(e) => setDiaryDate(e.target.value)}
              />
            </div>

            {rows.map((row, idx) => (
              <Card key={row.key} className="border-dashed">
                <CardContent className="pt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Medicine (catalog)</Label>
                    <Select
                      value={row.medicineId || 'none'}
                      onValueChange={(v) => {
                        const med = medicines.find((m) => m.id === v);
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  medicineId: v === 'none' ? '' : v,
                                  doseUnit: med?.unit ?? r.doseUnit,
                                }
                              : r
                          )
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medicine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        {medicines.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Or medicine name</Label>
                    <Input
                      value={row.medicineName}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, medicineName: e.target.value } : r))
                        )
                      }
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
                      placeholder="e.g. 100"
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
                    <Label>Route</Label>
                    <Input
                      value={row.route}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, route: e.target.value } : r))
                        )
                      }
                      placeholder="oral / iv / etc"
                    />
                  </div>
                  <div>
                    <Label>Taken?</Label>
                    <Select
                      value={row.taken}
                      onValueChange={(v) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, taken: v as 'yes' | 'no' } : r))
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
                    <Label>Taken time</Label>
                    <Input
                      value={row.takenTime}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, takenTime: e.target.value } : r))
                        )
                      }
                      placeholder="e.g. 08:00 AM"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Notes</Label>
                    <Input
                      value={row.notes}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, notes: e.target.value } : r))
                        )
                      }
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
              Add medication intake
            </Button>

            <div>
              <Label>End-of-day medication notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>

            <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving…' : 'Save medication diary'}
            </Button>
          </CardContent>
        </Card>

        {recent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent entries</CardTitle>
              <CardDescription>
                Click a date to preview that day&apos;s log. Use &quot;Load into form&quot; to edit.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {recent.slice(0, 7).map((d) => {
                const takenCount = d.intakes.filter((i) => i.taken).length;
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
                      {takenCount}/{d.intakes.length} taken
                      {d.totalDoses != null ? ` · ${d.totalDoses} dose(s)` : ''}
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
          dateLabel={previewEntry ? `Medication — ${previewEntry.diaryDate}` : ''}
          subtitle="Saved entry (read-only)"
          onLoadIntoForm={() => previewEntry && setDiaryDate(previewEntry.diaryDate)}
        >
          {previewEntry && (
            <>
              <p className="text-muted-foreground">
                {previewEntry.intakes.filter((i) => i.taken).length} of {previewEntry.intakes.length}{' '}
                marked taken
                {previewEntry.totalDoses != null ? ` · ${previewEntry.totalDoses} total dose(s)` : ''}
              </p>
              {previewEntry.intakes.length === 0 ? (
                <p className="text-muted-foreground">No medication lines recorded.</p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Dose</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewEntry.intakes.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">
                            {line.medicineName || 'Medicine'}
                          </TableCell>
                          <TableCell>{formatDose(line.doseText, line.doseUnit) || '—'}</TableCell>
                          <TableCell className="capitalize">{line.route || '—'}</TableCell>
                          <TableCell>{line.takenTime || '—'}</TableCell>
                          <TableCell
                            className={
                              line.taken ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700'
                            }
                          >
                            {line.taken ? 'Taken' : 'Missed'}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[140px] truncate">
                            {line.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {previewEntry.notes && (
                <div>
                  <p className="font-medium">End-of-day notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewEntry.notes}</p>
                </div>
              )}
            </>
          )}
        </DiaryEntryViewDialog>
      </main>
    </div>
  );
}
