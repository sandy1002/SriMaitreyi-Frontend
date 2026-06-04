import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { fetchCbpReports, saveCbpReport, updateCbpReport, deleteCbpReport } from '@/services/api';
import type { CbpReport, CbpReportsResponse } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Loader2, Pencil, Save, TestTube2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CbpReportPreviewDialog } from '@/components/clinical/CbpReportPreviewDialog';

const NUMERIC_FIELDS = [
  { key: 'hemoglobin', section: 'rbc' },
  { key: 'pcv_hematocrit', section: 'rbc' },
  { key: 'total_rbc_count', section: 'rbc' },
  { key: 'mcv', section: 'rbc' },
  { key: 'mch', section: 'rbc' },
  { key: 'mchc', section: 'rbc' },
  { key: 'rdw_cv', section: 'rbc' },
  { key: 'total_wbc_count', section: 'wbc' },
  { key: 'neutrophils_pct', section: 'dlc' },
  { key: 'lymphocytes_pct', section: 'dlc' },
  { key: 'eosinophils_pct', section: 'dlc' },
  { key: 'monocytes_pct', section: 'dlc' },
  { key: 'basophils_pct', section: 'dlc' },
  { key: 'total_platelet_count', section: 'platelets' },
  { key: 'mpv', section: 'platelets' },
  { key: 'pre_urea', section: 'renal_chemistry' },
  { key: 'post_urea', section: 'renal_chemistry' },
  { key: 'parathyroid_hormone', section: 'renal_chemistry' },
  { key: 'creatinine', section: 'renal_chemistry' },
  { key: 'phosphorus', section: 'renal_chemistry' },
  { key: 'serum_calcium', section: 'renal_chemistry' },
  { key: 'serum_potassium', section: 'renal_chemistry' },
  { key: 'albumin', section: 'renal_chemistry' },
] as const;

type NumericFieldKey = (typeof NUMERIC_FIELDS)[number]['key'];

const EMPTY_FORM: Record<string, string | boolean> = {
  report_date: new Date().toISOString().slice(0, 10),
  lab_name: '',
  notes: '',
  hemoglobin: '',
  pcv_hematocrit: '',
  total_rbc_count: '',
  mcv: '',
  mch: '',
  mchc: '',
  rdw_cv: '',
  total_wbc_count: '',
  neutrophils_pct: '',
  lymphocytes_pct: '',
  eosinophils_pct: '',
  monocytes_pct: '',
  basophils_pct: '',
  total_platelet_count: '',
  mpv: '',
  pre_urea: '',
  post_urea: '',
  parathyroid_hormone: '',
  creatinine: '',
  phosphorus: '',
  serum_calcium: '',
  serum_potassium: '',
  albumin: '',
  rbc_morphology: '',
  wbc_morphology: '',
  platelets_on_smear: '',
  parasites_seen: false,
  parasites_details: '',
};

function statusClass(status: string | null | undefined) {
  if (status === 'low' || status === 'high') return 'border-amber-500 bg-amber-50 dark:bg-amber-950/20';
  if (status === 'normal') return 'border-emerald-500/40';
  return '';
}

interface CbpReportCaptureProps {
  patientId: string;
  patientGender?: string;
  showCardHeader?: boolean;
}

export function CbpReportCapture({ patientId, patientGender, showCardHeader = true }: CbpReportCaptureProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<CbpReportsResponse | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [lastSaved, setLastSaved] = useState<CbpReport | null>(null);
  const [previewReport, setPreviewReport] = useState<CbpReport | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await fetchCbpReports(patientId);
      setData(res);
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not load CBP records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const fieldMeta = useMemo(() => {
    const map = new Map<string, { label: string; unit: string; section: string; reference_range?: string }>();
    data?.reference.fields.forEach((f) => map.set(f.key, f));
    return map;
  }, [data]);

  const sectionTitles = useMemo(() => {
    const map = new Map<string, string>();
    data?.reference.sections.forEach((s) => map.set(s.id, s.title));
    return map;
  }, [data]);

  const parseNum = (v: string) => {
    if (v === '' || v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const liveUrr = useMemo(() => {
    const pre = parseNum(String(form.pre_urea));
    const post = parseNum(String(form.post_urea));
    if (pre == null || post == null || pre <= 0) return null;
    const pct = Math.round((1 - post / pre) * 1000) / 10;
    return {
      pct,
      adequate: pct >= 65,
    };
  }, [form.pre_urea, form.post_urea]);

  const setField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => ({
    report_date: String(form.report_date),
    lab_name: form.lab_name || undefined,
    notes: form.notes || undefined,
    hemoglobin: parseNum(String(form.hemoglobin)),
    pcv_hematocrit: parseNum(String(form.pcv_hematocrit)),
    total_rbc_count: parseNum(String(form.total_rbc_count)),
    mcv: parseNum(String(form.mcv)),
    mch: parseNum(String(form.mch)),
    mchc: parseNum(String(form.mchc)),
    rdw_cv: parseNum(String(form.rdw_cv)),
    total_wbc_count: parseNum(String(form.total_wbc_count)),
    neutrophils_pct: parseNum(String(form.neutrophils_pct)),
    lymphocytes_pct: parseNum(String(form.lymphocytes_pct)),
    eosinophils_pct: parseNum(String(form.eosinophils_pct)),
    monocytes_pct: parseNum(String(form.monocytes_pct)),
    basophils_pct: parseNum(String(form.basophils_pct)),
    total_platelet_count: parseNum(String(form.total_platelet_count)),
    mpv: parseNum(String(form.mpv)),
    pre_urea: parseNum(String(form.pre_urea)),
    post_urea: parseNum(String(form.post_urea)),
    parathyroid_hormone: parseNum(String(form.parathyroid_hormone)),
    creatinine: parseNum(String(form.creatinine)),
    phosphorus: parseNum(String(form.phosphorus)),
    serum_calcium: parseNum(String(form.serum_calcium)),
    serum_potassium: parseNum(String(form.serum_potassium)),
    albumin: parseNum(String(form.albumin)),
    rbc_morphology: form.rbc_morphology || undefined,
    wbc_morphology: form.wbc_morphology || undefined,
    platelets_on_smear: form.platelets_on_smear || undefined,
    parasites_seen: Boolean(form.parasites_seen),
    parasites_details: form.parasites_details || undefined,
  });

  const reportToForm = (r: CbpReport): Record<string, string | boolean> => {
    const next: Record<string, string | boolean> = { ...EMPTY_FORM };
    next.report_date = r.report_date;
    next.lab_name = r.lab_name ?? '';
    next.notes = r.notes ?? '';
    for (const { key } of NUMERIC_FIELDS) {
      const v = r[key as keyof CbpReport];
      if (v != null && v !== '') next[key] = String(v);
    }
    next.rbc_morphology = r.rbc_morphology ?? '';
    next.wbc_morphology = r.wbc_morphology ?? '';
    next.platelets_on_smear = r.platelets_on_smear ?? '';
    next.parasites_seen = Boolean(r.parasites_seen);
    next.parasites_details = r.parasites_details ?? '';
    return next;
  };

  const loadReportForEdit = (r: CbpReport) => {
    setEditingReportId(r.id);
    setForm(reportToForm(r));
    setPreviewReport(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingReportId(null);
    setForm({ ...EMPTY_FORM, report_date: new Date().toISOString().slice(0, 10) });
  };

  const handleSave = async () => {
    if (!form.report_date) {
      toast({ title: 'Report date is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const saved = editingReportId
        ? await updateCbpReport(patientId, editingReportId, buildPayload())
        : await saveCbpReport(patientId, buildPayload());
      setLastSaved(saved);
      toast({
        title: editingReportId ? 'CBP report updated' : 'CBP report saved',
        description:
          saved.abnormal_count && saved.abnormal_count > 0
            ? `${saved.abnormal_count} value(s) outside reference range.`
            : 'All entered values within reference range.',
      });
      await load();
      setEditingReportId(null);
      setForm({ ...EMPTY_FORM, report_date: new Date().toISOString().slice(0, 10) });
    } catch (e) {
      console.error(e);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteCbpReport(patientId, reportId);
      if (lastSaved?.id === reportId) setLastSaved(null);
      toast({ title: 'CBP report deleted' });
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not delete report', variant: 'destructive' });
      throw e;
    }
  };

  const renderNumericField = (key: NumericFieldKey) => {
    const meta = fieldMeta.get(key);
    if (!meta) return null;
    const flag = lastSaved?.field_flags?.[key];
    const status = flag?.status;

    return (
      <div key={key} className={cn('space-y-1 rounded-md border p-3', statusClass(status))}>
        <Label className="text-xs font-medium leading-snug">{meta.label}</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="any"
            className="h-9"
            value={String(form[key] ?? '')}
            onChange={(e) => setField(key, e.target.value)}
            placeholder="Observed value"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{meta.unit}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ref: {flag?.reference_range || meta.reference_range || '—'}
        </p>
        {status && status !== 'normal' && (
          <Badge variant="outline" className="text-[10px] capitalize">
            {status}
          </Badge>
        )}
      </div>
    );
  };

  const fieldsForSection = (sectionId: string) =>
    NUMERIC_FIELDS.filter((f) => f.section === sectionId).map((f) => renderNumericField(f.key));

  const genderLabel = patientGender || data?.patient_gender || '—';

  return (
    <Card className="shadow-clinical border-primary/15">
      {showCardHeader && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TestTube2 className="h-5 w-5 text-primary" />
            Complete blood picture (CBP)
          </CardTitle>
          <CardDescription>
            Record lab values with reference ranges (gender on file: {genderLabel}). Values outside range are flagged automatically.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {!showCardHeader && (
          <p className="text-sm text-muted-foreground">
            Gender on file: {genderLabel}. Values outside reference range are flagged automatically.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Report date</Label>
            <Input
              type="date"
              value={String(form.report_date)}
              onChange={(e) => setField('report_date', e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Lab / facility (optional)</Label>
            <Input
              value={String(form.lab_name)}
              onChange={(e) => setField('lab_name', e.target.value)}
              placeholder="Diagnostic laboratory name"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading reference ranges…
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={['rbc', 'wbc', 'dlc', 'platelets', 'renal_chemistry', 'smear']}>
            <AccordionItem value="rbc">
              <AccordionTrigger>{sectionTitles.get('rbc')}</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                  {fieldsForSection('rbc')}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="wbc">
              <AccordionTrigger>{sectionTitles.get('wbc')}</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-2 pt-2">{fieldsForSection('wbc')}</div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="dlc">
              <AccordionTrigger>{sectionTitles.get('dlc')}</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                  {fieldsForSection('dlc')}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="platelets">
              <AccordionTrigger>{sectionTitles.get('platelets')}</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-2 pt-2">{fieldsForSection('platelets')}</div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="renal_chemistry">
              <AccordionTrigger>{sectionTitles.get('renal_chemistry')}</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                  {fieldsForSection('renal_chemistry')}
                </div>
                {liveUrr && (
                  <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">URR (preview): </span>
                    <strong>{liveUrr.pct}%</strong>
                    <span className="text-muted-foreground">
                      {' '}
                      — {liveUrr.adequate ? 'adequate' : 'below 65% target'} (from pre/post urea)
                    </span>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="smear">
              <AccordionTrigger>{sectionTitles.get('smear')}</AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label>RBC morphology</Label>
                  <Textarea
                    value={String(form.rbc_morphology)}
                    onChange={(e) => setField('rbc_morphology', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>WBC morphology</Label>
                  <Textarea
                    value={String(form.wbc_morphology)}
                    onChange={(e) => setField('wbc_morphology', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Platelets on smear</Label>
                  <Textarea
                    value={String(form.platelets_on_smear)}
                    onChange={(e) => setField('platelets_on_smear', e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parasites / abnormal cells</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={!form.parasites_seen}
                        onCheckedChange={(v) => {
                          if (v) {
                            setField('parasites_seen', false);
                            setField('parasites_details', '');
                          }
                        }}
                      />
                      Not seen
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={Boolean(form.parasites_seen)}
                        onCheckedChange={(v) => setField('parasites_seen', !!v)}
                      />
                      Seen
                    </label>
                  </div>
                  {form.parasites_seen && (
                    <Input
                      placeholder="Specify findings"
                      value={String(form.parasites_details)}
                      onChange={(e) => setField('parasites_details', e.target.value)}
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <div className="space-y-1">
          <Label>Notes (optional)</Label>
          <Textarea
            value={String(form.notes)}
            onChange={(e) => setField('notes', e.target.value)}
            rows={2}
            placeholder="Clinical notes about this CBP"
          />
        </div>

        {editingReportId && (
          <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
            Editing report dated {String(form.report_date)}. Save to apply changes or cancel to start a new entry.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving || loading} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {editingReportId ? 'Update CBP report' : 'Save CBP report'}
          </Button>
          {editingReportId && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancel edit
            </Button>
          )}
        </div>

        {!loading && (data?.reports.length ?? 0) > 0 && (
          <div className="border-t pt-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              Previous reports
            </h4>
            <p className="text-xs text-muted-foreground">
              Click to preview, or use Edit to change a saved report.
            </p>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {data!.reports.map((r) => (
                <li
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/30"
                  onClick={() => setPreviewReport(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPreviewReport(r);
                    }
                  }}
                >
                  <span>
                    <span className="font-medium">{r.report_date}</span>
                    {r.lab_name && (
                      <span className="text-muted-foreground"> · {r.lab_name}</span>
                    )}
                    {r.urr_pct != null && (
                      <span className="text-muted-foreground"> · URR {r.urr_pct}%</span>
                    )}
                  </span>
                  <div className="flex flex-wrap gap-1 items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadReportForEdit(r);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {r.urr_status === 'suboptimal' && (
                      <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-500">
                        URR low
                      </Badge>
                    )}
                    {r.abnormal_count ? (
                      <Badge variant="destructive" className="text-[10px]">
                        {r.abnormal_count} abnormal
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Normal range
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <CbpReportPreviewDialog
          report={previewReport}
          reference={data?.reference ?? null}
          open={!!previewReport}
          onOpenChange={(open) => !open && setPreviewReport(null)}
          onDelete={handleDeleteReport}
        />
      </CardContent>
    </Card>
  );
}
