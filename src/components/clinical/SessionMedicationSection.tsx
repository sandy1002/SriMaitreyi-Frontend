import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Pill, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
import { DOSE_UNITS, formatDose } from '@/lib/clinicalUnits';
import type { Medicine, SessionMedicationIntake } from '@/types';

interface Props {
  sessionId: string;
  sessionDate?: string;
  readOnly: boolean;
  initialIntakes?: SessionMedicationIntake[];
  onUpdated?: () => void;
}

export function SessionMedicationSection({
  sessionId,
  sessionDate,
  readOnly,
  initialIntakes = [],
  onUpdated,
}: Props) {
  const { toast } = useToast();
  const [intakes, setIntakes] = useState<SessionMedicationIntake[]>(initialIntakes);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineId, setMedicineId] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [doseText, setDoseText] = useState('');
  const [doseUnit, setDoseUnit] = useState('');
  const [route, setRoute] = useState('oral');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIntakes(initialIntakes);
  }, [initialIntakes]);

  useEffect(() => {
    api.fetchMedicines().then(setMedicines).catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (!medicineId && !medicineName.trim()) {
      toast({ title: 'Select a medicine or enter a name', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const row = await api.addSessionMedication(sessionId, {
        medicine_id: medicineId || undefined,
        medicine_name: medicineName || undefined,
        dose_text: doseText || undefined,
        dose_unit: doseUnit || undefined,
        route,
      });
      setIntakes((prev) => [...prev, row]);
      setMedicineId('');
      setMedicineName('');
      setDoseText('');
      setDoseUnit('');
      onUpdated?.();
      toast({ title: 'Medication logged' });
    } catch {
      toast({ title: 'Failed to log medication', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medication during dialysis session
        </CardTitle>
        <CardDescription>
          {sessionDate ? (
            <>
              Dialysis session date: <strong>{sessionDate}</strong>. IV antibiotics, iron, saline
              flushes, and oral medicines given during this run.
            </>
          ) : (
            'IV antibiotics, iron, saline flushes, and oral medicines given during dialysis.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {intakes.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {intakes.map((i) => (
              <li key={i.id} className="flex justify-between gap-2 border rounded-md p-2">
                <span>
                  <span className="font-medium">{i.medicineName ?? 'Medication'}</span>
                  {(i.doseText || i.doseUnit) && (
                    <span className="text-muted-foreground">
                      {' '}
                      — {formatDose(i.doseText, i.doseUnit)}
                    </span>
                  )}
                  {i.route && (
                    <span className="text-muted-foreground text-xs ml-1">({i.route})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No medicines logged for this session yet.</p>
        )}

        {!readOnly && (
          <div className="grid gap-3 sm:grid-cols-2 border-t pt-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>From catalog</Label>
              <Select
                value={medicineId}
                onValueChange={(v) => {
                  setMedicineId(v);
                  const med = medicines.find((m) => m.id === v);
                  if (med?.unit) setDoseUnit(med.unit);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select medicine (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Or name</Label>
              <Input
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                placeholder="e.g. IV iron"
              />
            </div>
            <div className="space-y-2">
              <Label>Dose</Label>
              <Input
                value={doseText}
                onChange={(e) => setDoseText(e.target.value)}
                placeholder="e.g. 100"
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={doseUnit || 'none'} onValueChange={(v) => setDoseUnit(v === 'none' ? '' : v)}>
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
            <div className="space-y-2">
              <Label>Route</Label>
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="iv">IV</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="button" onClick={handleAdd} disabled={saving}>
                <Plus className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Add intake'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
