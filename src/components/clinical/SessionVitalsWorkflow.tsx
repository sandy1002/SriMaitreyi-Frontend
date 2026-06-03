import { useCallback, useEffect, useState } from 'react';
import { Activity, Clock, Droplets, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as api from '@/services/api';
import type { ClinicalAlert, ClinicalCheck, VitalsWorkflowState } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatISTDateTime, nowISTClock } from '@/lib/datetime';

interface SessionVitalsWorkflowProps {
  sessionId: string;
  isCompleted: boolean;
  initialReadings?: VitalsWorkflowState['readings'];
  onAlertsUpdated?: () => void;
}

export function SessionVitalsWorkflow({
  sessionId,
  isCompleted,
  initialReadings = [],
  onAlertsUpdated,
}: SessionVitalsWorkflowProps) {
  const { toast } = useToast();
  const [workflow, setWorkflow] = useState<VitalsWorkflowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayTime, setDisplayTime] = useState(() => nowISTClock());

  const [bloodPressure, setBloodPressure] = useState('');
  const [pulse, setPulse] = useState('');
  const [potassium, setPotassium] = useState('');
  const [ufRemoved, setUfRemoved] = useState('');
  const [notes, setNotes] = useState('');

  const loadWorkflow = useCallback(async () => {
    if (isCompleted) {
      setWorkflow({
        readings: initialReadings,
        slots: [],
        nextDue: null,
      });
      setLoading(false);
      return;
    }
    try {
      const data = await api.getVitalsWorkflow(sessionId);
      setWorkflow(data);
      if (data.currentTime) {
        setDisplayTime(formatDateTime(data.currentTime));
      }
    } catch {
      setWorkflow(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, isCompleted, initialReadings]);

  useEffect(() => {
    setLoading(true);
    loadWorkflow();
    const timer = setInterval(loadWorkflow, 60_000);
    return () => clearInterval(timer);
  }, [loadWorkflow]);

  useEffect(() => {
    if (isCompleted) return;
    const tick = setInterval(() => {
      setDisplayTime(nowISTClock());
    }, 1000);
    return () => clearInterval(tick);
  }, [isCompleted]);

  const handleSave = async () => {
    if (!bloodPressure && !pulse && !potassium && !notes) {
      toast({
        title: 'Enter vitals',
        description: 'Add BP, pulse, potassium (Pre K), or notes.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      const result = await api.recordSessionVitals(sessionId, {
        blood_pressure: bloodPressure || undefined,
        pulse: pulse ? Number(pulse) : undefined,
        potassium_mmol_l: potassium ? Number(potassium) : undefined,
        uf_removed_liters: ufRemoved ? Number(ufRemoved) : undefined,
        notes: notes || undefined,
      });
      setWorkflow(result.workflow);
      onAlertsUpdated?.();
      setBloodPressure('');
      setPulse('');
      setPotassium('');
      setUfRemoved('');
      setNotes('');
      toast({
        title: 'Vitals recorded',
        description: result.alerts.length
          ? `${result.alerts.length} alert(s) updated.`
          : `Saved at ${formatISTDateTime(result.reading.recordedAt)}`,
      });
      await loadWorkflow();
    } catch {
      toast({ title: 'Failed to save vitals', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (isCompleted) {
    const readings = workflow?.readings?.length ? workflow.readings : initialReadings;
    return readings.length ? (
      <Card className="shadow-clinical">
        <CardHeader>
          <CardTitle className="text-lg">Session vitals log</CardTitle>
        </CardHeader>
        <CardContent>
          <VitalsTable readings={readings} />
        </CardContent>
      </Card>
    ) : null;
  }

  if (loading && !workflow) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading vitals workflow…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-clinical border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          During-session vitals
        </CardTitle>
        <CardDescription>
          Each reading is stamped with the actual date and time when you save — no fixed intervals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Session started</Label>
            <Input
              readOnly
              className="bg-muted/50"
              value={formatISTDateTime(workflow?.sessionStartedAt)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recording time (auto)
            </Label>
            <Input readOnly className="bg-muted/50 font-medium" value={displayTime} />
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <p className="text-sm font-medium">Record vitals now</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="wf-bp" className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> BP
              </Label>
              <Input
                id="wf-bp"
                placeholder="120/80"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="wf-pulse">Pulse</Label>
              <Input
                id="wf-pulse"
                type="number"
                placeholder="72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="wf-k" className="flex items-center gap-1">
                <Droplets className="h-3 w-3" /> Potassium (Pre K) mmol/L
              </Label>
              <Input
                id="wf-k"
                type="number"
                step="0.1"
                placeholder="4.5"
                value={potassium}
                onChange={(e) => setPotassium(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="wf-uf">Fluid removed so far (L)</Label>
              <Input
                id="wf-uf"
                type="number"
                step="0.1"
                value={ufRemoved}
                onChange={(e) => setUfRemoved(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="wf-notes">Clinic notes / cramps</Label>
            <Textarea
              id="wf-notes"
              placeholder="e.g. mild cramping left calf"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save vitals now'}
          </Button>
        </div>

        {workflow && workflow.readings.length > 0 && (
          <VitalsTable readings={workflow.readings} />
        )}
      </CardContent>
    </Card>
  );
}

function VitalsTable({
  readings,
}: {
  readings: VitalsWorkflowState['readings'];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date &amp; time</TableHead>
          <TableHead>BP</TableHead>
          <TableHead>Pulse</TableHead>
          <TableHead>K+ (mmol/L)</TableHead>
          <TableHead>UF (L)</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {readings.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">
              {r.recordedAt
                ? formatISTDateTime(r.recordedAt)
                : r.label ?? '—'}
            </TableCell>
            <TableCell>{r.bloodPressure ?? '—'}</TableCell>
            <TableCell>{r.pulse ?? '—'}</TableCell>
            <TableCell>{r.potassiumMmolL ?? '—'}</TableCell>
            <TableCell>{r.ufRemovedLiters ?? '—'}</TableCell>
            <TableCell className="max-w-[200px] truncate">{r.notes ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
