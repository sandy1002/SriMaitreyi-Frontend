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
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Droplets, Plus, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import { DiaryEntryViewDialog } from '@/components/clinical/DiaryEntryViewDialog';
import {
  FLUID_VOLUME_UNITS,
  formatVolumeFromMl,
  volumeInputFromMl,
  volumeToMl,
  type FluidVolumeUnit,
} from '@/lib/clinicalUnits';
import type { RenalFluidDiaryEntry, RenalFluidIntakeInput } from '@/types';

const CATEGORIES = [
  { value: 'oral', label: 'Oral (water, ice chips)' },
  { value: 'iv', label: 'IV fluids / saline / meds' },
  { value: 'prime_rinseback', label: 'Prime / rinseback' },
  { value: 'other', label: 'Other' },
] as const;

type IntakeRow = {
  key: string;
  category: string;
  description: string;
  volume: string;
  volumeUnit: FluidVolumeUnit;
  recordedTime: string;
};

const emptyRow = (): IntakeRow => ({
  key: crypto.randomUUID(),
  category: 'oral',
  description: '',
  volume: '',
  volumeUnit: 'ml',
  recordedTime: '',
});

export default function RenalFluidDiaryPage() {
  const { patient, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [diaryDate, setDiaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<IntakeRow[]>([emptyRow()]);
  const [notes, setNotes] = useState('');
  const [recent, setRecent] = useState<RenalFluidDiaryEntry[]>([]);
  const [previewEntry, setPreviewEntry] = useState<RenalFluidDiaryEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const categoryLabel = (value: string) =>
    CATEGORIES.find((c) => c.value === value)?.label ?? value;

  useEffect(() => {
    if (!patient?.id) return;
    api.fetchFluidDiaries(patient.id).then(setRecent).catch(console.error);
  }, [patient?.id]);

  useEffect(() => {
    const existing = recent.find((d) => d.diaryDate === diaryDate);
    if (!existing) {
      setRows([emptyRow()]);
      setNotes('');
      return;
    }
    setNotes(existing.notes ?? '');
    setRows(
      existing.intakes.length
        ? existing.intakes.map((i) => ({
            key: i.id ?? crypto.randomUUID(),
            category: i.category,
            description: i.description ?? '',
            volume: volumeInputFromMl(i.volumeMl, i.volumeUnit),
            volumeUnit: (i.volumeUnit === 'L' ? 'L' : 'ml') as FluidVolumeUnit,
            recordedTime: i.recordedTime ?? '',
          }))
        : [emptyRow()]
    );
  }, [diaryDate, recent]);

  if (!isAuthenticated || !patient) return <Navigate to="/login" replace />;
  if (user?.role !== 'patient') return <Navigate to="/admin" replace />;

  const buildPayload = (): RenalFluidIntakeInput[] =>
    rows
      .filter((r) => r.volume || r.description)
      .map((r) => ({
        category: r.category,
        description: r.description || undefined,
        volume_ml: r.volume ? volumeToMl(Number(r.volume), r.volumeUnit) : undefined,
        volume_unit: r.volumeUnit,
        recorded_time: r.recordedTime || undefined,
      }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveFluidDiary(patient.id, {
        diary_date: diaryDate,
        notes: notes || undefined,
        intakes: buildPayload(),
      });
      toast({ title: 'Fluid diary saved' });
      const list = await api.fetchFluidDiaries(patient.id);
      setRecent(list);
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const totals = recent.find((d) => d.diaryDate === diaryDate);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 max-w-2xl space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/15">
                <Droplets className="h-6 w-6 text-sky-700 dark:text-sky-400" />
              </div>
              <div>
                <CardTitle>Renal fluid diary</CardTitle>
                <CardDescription>
                  Log oral intake, IV fluids, prime/rinseback, and other volumes (ml).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fluid-date">Date</Label>
              <Input
                id="fluid-date"
                type="date"
                value={diaryDate}
                onChange={(e) => setDiaryDate(e.target.value)}
              />
            </div>

            {totals && (
              <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 p-3">
                Totals: oral {totals.totalOralMl ?? 0} ml · IV {totals.totalIvMl ?? 0} ml ·
                prime/rinseback {totals.totalPrimeRinsebackMl ?? 0} ml · other{' '}
                {totals.totalOtherMl ?? 0} ml
              </p>
            )}

            <div className="space-y-3">
              <Label>Intake entries</Label>
              {rows.map((row, idx) => (
                <div key={row.key} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                  <Select
                    value={row.category}
                    onValueChange={(v) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, category: v } : r))
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Volume"
                      className="flex-1"
                      value={row.volume}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((r, i) => (i === idx ? { ...r, volume: e.target.value } : r))
                        )
                      }
                    />
                    <Select
                      value={row.volumeUnit}
                      onValueChange={(v) =>
                        setRows((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, volumeUnit: v as FluidVolumeUnit } : r
                          )
                        )
                      }
                    >
                      <SelectTrigger className="w-[72px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FLUID_VOLUME_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    className="sm:col-span-2"
                    placeholder="Description (optional)"
                    value={row.description}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r))
                      )
                    }
                  />
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
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setRows((p) => [...p, emptyRow()])}>
                <Plus className="h-4 w-4 mr-2" />
                Add line
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fluid-notes">Notes</Label>
              <Textarea
                id="fluid-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="End-of-day notes"
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save diary'}
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
                const totalMl =
                  (d.totalOralMl ?? 0) +
                  (d.totalIvMl ?? 0) +
                  (d.totalPrimeRinsebackMl ?? 0) +
                  (d.totalOtherMl ?? 0);
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
                      {totalMl} ml total · {d.intakes.length} line(s)
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
          dateLabel={previewEntry ? `Fluid — ${previewEntry.diaryDate}` : ''}
          subtitle="Saved entry (read-only)"
          onLoadIntoForm={() => previewEntry && setDiaryDate(previewEntry.diaryDate)}
        >
          {previewEntry && (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-xs sm:text-sm">
                <div>Oral: <strong>{previewEntry.totalOralMl ?? 0} ml</strong></div>
                <div>IV: <strong>{previewEntry.totalIvMl ?? 0} ml</strong></div>
                <div>Prime/rinseback: <strong>{previewEntry.totalPrimeRinsebackMl ?? 0} ml</strong></div>
                <div>Other: <strong>{previewEntry.totalOtherMl ?? 0} ml</strong></div>
              </div>
              {previewEntry.intakes.length === 0 ? (
                <p className="text-muted-foreground">No intake lines recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {previewEntry.intakes.map((line) => (
                    <li key={line.id} className="border rounded-lg p-3">
                      <p className="font-medium">{categoryLabel(line.category)}</p>
                      <p>
                        {formatVolumeFromMl(line.volumeMl, line.volumeUnit)}
                        {line.recordedTime ? ` · ${line.recordedTime}` : ''}
                      </p>
                      {line.description && (
                        <p className="text-muted-foreground">{line.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {previewEntry.notes && (
                <div>
                  <p className="font-medium">Notes</p>
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
