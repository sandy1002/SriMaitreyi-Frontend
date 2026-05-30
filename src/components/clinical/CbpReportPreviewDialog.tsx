import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CbpReport, CbpReportsResponse } from '@/types';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type CbpReportPreviewDialogProps = {
  report: CbpReport | null;
  reference: CbpReportsResponse['reference'] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (reportId: string) => Promise<void>;
};

function statusBadge(status: string | null | undefined) {
  if (status === 'low' || status === 'high') {
    return (
      <Badge variant="outline" className="text-[10px] capitalize text-amber-700 border-amber-500">
        {status}
      </Badge>
    );
  }
  if (status === 'normal') {
    return (
      <Badge variant="secondary" className="text-[10px]">
        normal
      </Badge>
    );
  }
  return null;
}

function formatValue(value: number | null | undefined, unit?: string) {
  if (value == null) return '—';
  return unit ? `${value} ${unit}` : String(value);
}

export function CbpReportPreviewDialog({
  report,
  reference,
  open,
  onOpenChange,
  onDelete,
}: CbpReportPreviewDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!report) return;
    setDeleting(true);
    try {
      await onDelete(report.id);
      setConfirmOpen(false);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  const numericSections = reference?.sections.filter((s) => s.id !== 'smear') ?? [];

  const fieldsBySection = new Map<string, { key: string; label: string; unit: string }[]>();
  reference?.fields.forEach((f) => {
    const list = fieldsBySection.get(f.section) ?? [];
    list.push({ key: f.key, label: f.label, unit: f.unit });
    fieldsBySection.set(f.section, list);
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CBP report — {report?.report_date ?? ''}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              {report?.lab_name && <span>{report.lab_name}</span>}
              {report?.abnormal_count ? (
                <Badge variant="destructive" className="text-[10px]">
                  {report.abnormal_count} abnormal value(s)
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  All values in range
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {report && (
            <div className="space-y-4 text-sm">
              {numericSections.map((section) => {
                const fields = fieldsBySection.get(section.id) ?? [];
                const hasAny = fields.some((f) => report.field_flags?.[f.key]?.value != null);
                if (!hasAny) return null;

                return (
                  <div key={section.id} className="space-y-2">
                    <h4 className="font-semibold text-foreground">{section.title}</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {fields.map((f) => {
                        const flag = report.field_flags?.[f.key];
                        if (flag?.value == null) return null;
                        return (
                          <div
                            key={f.key}
                            className={cn(
                              'rounded-md border px-3 py-2',
                              flag.status === 'low' || flag.status === 'high'
                                ? 'border-amber-500/60 bg-amber-50/50 dark:bg-amber-950/20'
                                : 'border-border'
                            )}
                          >
                            <p className="text-xs text-muted-foreground">{flag.label || f.label}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <span className="font-medium">
                                {formatValue(flag.value, flag.unit || f.unit)}
                              </span>
                              {statusBadge(flag.status)}
                            </div>
                            {flag.reference_range && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Ref: {flag.reference_range}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {section.id === 'renal_chemistry' &&
                      report.urr_pct != null &&
                      report.pre_urea != null &&
                      report.post_urea != null && (
                        <div
                          className={cn(
                            'rounded-md border px-3 py-3 sm:col-span-2',
                            report.urr_status === 'suboptimal'
                              ? 'border-amber-500/60 bg-amber-50/50 dark:bg-amber-950/20'
                              : 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20'
                          )}
                        >
                          <p className="text-xs text-muted-foreground">URR (Urea Reduction Ratio)</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-lg font-semibold">{report.urr_pct}%</span>
                            <Badge
                              variant={report.urr_status === 'adequate' ? 'secondary' : 'outline'}
                              className={cn(
                                'text-[10px] capitalize',
                                report.urr_status === 'suboptimal' && 'text-amber-700 border-amber-500'
                              )}
                            >
                              {report.urr_status ?? 'calculated'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            Pre urea {report.pre_urea} mg/dL → Post urea {report.post_urea} mg/dL
                            {report.urr_target_pct != null && ` · Target ≥ ${report.urr_target_pct}%`}
                          </p>
                          {report.urr_interpretation && (
                            <p className="text-xs mt-2">{report.urr_interpretation}</p>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}

              {(report.rbc_morphology ||
                report.wbc_morphology ||
                report.platelets_on_smear ||
                report.parasites_seen) && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">
                    4. Peripheral blood smear examination
                  </h4>
                  <div className="space-y-2 rounded-md border p-3">
                    {report.rbc_morphology && (
                      <div>
                        <p className="text-xs text-muted-foreground">RBC morphology</p>
                        <p className="whitespace-pre-wrap">{report.rbc_morphology}</p>
                      </div>
                    )}
                    {report.wbc_morphology && (
                      <div>
                        <p className="text-xs text-muted-foreground">WBC morphology</p>
                        <p className="whitespace-pre-wrap">{report.wbc_morphology}</p>
                      </div>
                    )}
                    {report.platelets_on_smear && (
                      <div>
                        <p className="text-xs text-muted-foreground">Platelets on smear</p>
                        <p className="whitespace-pre-wrap">{report.platelets_on_smear}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Parasites / abnormal cells</p>
                      <p>
                        {report.parasites_seen
                          ? report.parasites_details || 'Seen'
                          : 'Not seen'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {report.notes && (
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">Notes</h4>
                  <p className="rounded-md border p-3 whitespace-pre-wrap text-muted-foreground">
                    {report.notes}
                  </p>
                </div>
              )}

              {report.created_at && (
                <p className="text-xs text-muted-foreground">
                  Saved {new Date(report.created_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              disabled={!report || deleting}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete report
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this CBP report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the report from {report?.report_date}
              {report?.lab_name ? ` (${report.lab_name})` : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
