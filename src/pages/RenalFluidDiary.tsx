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
  volumeMl: string;
  recordedTime: string;
};

const emptyRow = (): IntakeRow => ({
  key: crypto.randomUUID(),
  category: 'oral',
  description: '',
  volumeMl: '',
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
  const [saving, setSaving] = useState(false);

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
            volumeMl: i.volumeMl != null ? String(i.volumeMl) : '',
            recordedTime: i.recordedTime ?? '',
          }))
        : [emptyRow()]
    );
  }, [diaryDate, recent]);

  if (!isAuthenticated || !patient) return <Navigate to="/login" replace />;
  if (user?.role !== 'patient') return <Navigate to="/admin" replace />;

  const buildPayload = (): RenalFluidIntakeInput[] =>
    rows
      .filter((r) => r.volumeMl || r.description)
      .map((r) => ({
        category: r.category,
        description: r.description || undefined,
        volume_ml: r.volumeMl ? Number(r.volumeMl) : undefined,
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
                  <Input
                    type="number"
                    placeholder="Volume (ml)"
                    value={row.volumeMl}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, volumeMl: e.target.value } : r))
                      )
                    }
                  />
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
      </main>
    </div>
  );
}
