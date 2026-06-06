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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Save } from 'lucide-react';
import type { LabInvestigationType } from '@/types';

interface Props {
  typeMeta: LabInvestigationType;
  patientName: string;
  patientMrn?: string;
  patientAge?: string | number;
  patientGender?: string;
  reportDate: string;
  onReportDateChange: (v: string) => void;
  labName: string;
  onLabNameChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  values: Record<string, string>;
  onValuesChange: (next: Record<string, string>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  editing: boolean;
}

export function LabInvestigationForm({
  typeMeta,
  patientName,
  patientMrn,
  patientAge,
  patientGender,
  reportDate,
  onReportDateChange,
  labName,
  onLabNameChange,
  notes,
  onNotesChange,
  values,
  onValuesChange,
  onSave,
  onCancel,
  saving,
  editing,
}: Props) {
  const setValue = (key: string, val: string) => {
    onValuesChange({ ...values, [key]: val });
  };

  const sections =
    typeMeta.sections && typeMeta.sections.length > 0
      ? typeMeta.sections
      : [
          {
            id: 'default',
            title: 'Observed values',
            fields: typeMeta.fields ?? [],
          },
        ];

  return (
    <Card className="shadow-clinical border-primary/15">
      <CardHeader className="border-b bg-primary/5">
        <CardTitle className="text-lg uppercase tracking-wide text-primary">
          {typeMeta.label}
        </CardTitle>
        <CardDescription>{typeMeta.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 rounded-lg border bg-muted/30 p-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Patient name</p>
            <p className="font-medium">{patientName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">UHID / Reg No</p>
            <p className="font-medium">{patientMrn || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Age / Gender</p>
            <p className="font-medium">
              {patientAge ?? '—'} / {patientGender ?? '—'}
            </p>
          </div>
          <div>
            <Label className="text-xs">Report date</Label>
            <Input type="date" value={reportDate} onChange={(e) => onReportDateChange(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Lab / facility</Label>
            <Input value={labName} onChange={(e) => onLabNameChange(e.target.value)} placeholder="Laboratory name" />
          </div>
          {(typeMeta.meta_fields ?? []).map((mf) => (
            <div key={mf.key}>
              <Label className="text-xs">{mf.label}</Label>
              {mf.type === 'select' ? (
                <Select value={values[mf.key] || 'none'} onValueChange={(v) => setValue(mf.key, v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {(mf.options ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={mf.type === 'date' ? 'date' : 'text'}
                  value={values[mf.key] ?? ''}
                  onChange={(e) => setValue(mf.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {sections.map((section) => (
          <div key={section.id} className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary/90 border-b pb-1">
              {section.title}
            </h3>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10 hover:bg-primary/10">
                    <TableHead className="font-semibold w-[38%]">Investigation / Parameter</TableHead>
                    <TableHead className="font-semibold w-[18%]">Observed value</TableHead>
                    <TableHead className="font-semibold w-[12%]">Unit</TableHead>
                    <TableHead className="font-semibold">Reference range</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.fields.map((f) => (
                    <TableRow key={f.key}>
                      <TableCell className="align-top py-3">
                        <p className="font-medium text-sm">{f.label}</p>
                        {f.subtitle && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">{f.subtitle}</p>
                        )}
                      </TableCell>
                      <TableCell className="align-top py-2">
                        <Input
                          type="number"
                          step="any"
                          className="h-9"
                          value={values[f.key] ?? ''}
                          onChange={(e) => setValue(f.key, e.target.value)}
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell className="align-top py-3 text-sm text-muted-foreground">{f.unit}</TableCell>
                      <TableCell className="align-top py-3 text-xs text-muted-foreground leading-relaxed">
                        {f.reference_range ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

        {(typeMeta.clinical_notes ?? []).length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
            <p className="text-sm font-semibold">Clinical reference notes</p>
            <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1.5">
              {typeMeta.clinical_notes!.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <Label>Additional notes</Label>
          <Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={2} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {editing ? 'Update report' : 'Save report'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
