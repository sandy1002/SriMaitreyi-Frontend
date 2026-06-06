import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, Eye, FileText } from 'lucide-react';
import {
  downloadMedicalReport,
  fetchMedicalReportPdf,
  MEDICAL_REPORT_OPTIONS,
  medicalReportLabel,
} from '@/services/api';
import type { MedicalReportType } from '@/services/api';
import { REPORT_DAY_OPTIONS, type ReportDayRange } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/types';
import { MedicalReportPreviewDialog } from '@/components/clinical/MedicalReportPreviewDialog';

interface MedicalReportDownloadProps {
  patientId: string;
  patientName?: string;
  patients?: Patient[];
  allowPatientSelect?: boolean;
  title?: string;
  description?: string;
}

interface ReportActionSplitButtonProps {
  icon: LucideIcon;
  label: string;
  busyLabel: string;
  variant?: 'default' | 'outline';
  busy: boolean;
  disabled: boolean;
  reportType: MedicalReportType;
  onAction: (reportType: MedicalReportType) => void;
}

function ReportActionSplitButton({
  icon: Icon,
  label,
  busyLabel,
  variant = 'default',
  busy,
  disabled,
  reportType,
  onAction,
}: ReportActionSplitButtonProps) {
  const isOutline = variant === 'outline';
  const menuSideClass = isOutline
    ? 'rounded-l-none border-l border-input px-2'
    : 'rounded-l-none border-l border-primary-foreground/20 px-2';

  return (
    <div className="inline-flex rounded-md shadow-sm">
      <Button
        type="button"
        variant={variant}
        className="rounded-r-none"
        disabled={disabled || busy}
        onClick={() => onAction(reportType)}
      >
        <Icon className="h-4 w-4 mr-2" />
        {busy ? busyLabel : label}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={variant}
            className={menuSideClass}
            disabled={disabled || busy}
            aria-label={`${label} options`}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Choose report type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {MEDICAL_REPORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onAction(option.value)}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MedicalReportDownload({
  patientId: defaultPatientId,
  patientName,
  patients = [],
  allowPatientSelect = false,
  title = 'Medical report',
  description = 'Preview the PDF in a popup on this page, then download from the preview if needed. Rough summary is short and crisp; final summary includes full session, nutrition, fluid, and diary details. Medications, CBP, lipid, and liver panels always show all-time data.',
}: MedicalReportDownloadProps) {
  const { toast } = useToast();
  const [days, setDays] = useState<ReportDayRange>(7);
  const [reportType, setReportType] = useState<MedicalReportType>('summary');
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId);
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  const effectivePatientId = allowPatientSelect ? selectedPatientId : defaultPatientId;
  const effectiveName =
    patientName ||
    patients.find((p) => p.id === effectivePatientId)?.name ||
    'patient';

  useEffect(() => {
    if (!previewOpen) {
      setPreviewBlob(null);
    }
  }, [previewOpen]);

  const handlePreview = async (type: MedicalReportType) => {
    if (!effectivePatientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    setReportType(type);
    setPreviewing(true);
    try {
      const blob = await fetchMedicalReportPdf(effectivePatientId, days, type, 'inline');
      setPreviewBlob(blob);
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Preview failed',
        description: err instanceof Error ? err.message : 'Could not generate report.',
        variant: 'destructive',
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownload = async (type: MedicalReportType) => {
    if (!effectivePatientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    setReportType(type);
    setDownloading(true);
    try {
      await downloadMedicalReport(effectivePatientId, days, effectiveName, type);
      toast({
        title: 'Report downloaded',
        description: `${medicalReportLabel(type)} (last ${days} days) saved as PDF.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Could not generate report.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const busy = previewing;
  const selectedLabel = medicalReportLabel(reportType);

  return (
    <Card className="shadow-clinical border-primary/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          {allowPatientSelect && patients.length > 0 && (
            <div className="flex-1 min-w-[200px] space-y-2">
              <Label>Patient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.medicalRecordNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2 sm:w-40">
            <Label>Period</Label>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v) as ReportDayRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_DAY_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Last {d} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Default report type: <span className="font-medium text-foreground">{selectedLabel}</span>.
          Use the arrow on the preview button to pick rough or final summary.
        </p>

        <div className="flex flex-wrap gap-2">
          <ReportActionSplitButton
            icon={Eye}
            label={`Preview PDF (${selectedLabel})`}
            busyLabel="Generating…"
            variant="outline"
            busy={previewing}
            disabled={busy || !effectivePatientId}
            reportType={reportType}
            onAction={handlePreview}
          />
        </div>
      </CardContent>

      <MedicalReportPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfBlob={previewBlob}
        title={`${selectedLabel} — ${effectiveName}`}
        subtitle={`Last ${days} days · scroll to view all pages · download when ready`}
        onDownload={() => handleDownload(reportType)}
        downloading={downloading}
      />
    </Card>
  );
}
