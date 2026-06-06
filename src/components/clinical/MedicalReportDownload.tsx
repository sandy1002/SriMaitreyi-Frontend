import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Eye, FileText } from 'lucide-react';
import { downloadMedicalReport, fetchMedicalReportPdf } from '@/services/api';
import type { MedicalReportType } from '@/services/api';
import { REPORT_DAY_OPTIONS, type ReportDayRange } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { Patient } from '@/types';

interface MedicalReportDownloadProps {
  patientId: string;
  patientName?: string;
  patients?: Patient[];
  allowPatientSelect?: boolean;
  title?: string;
  description?: string;
}

export function MedicalReportDownload({
  patientId: defaultPatientId,
  patientName,
  patients = [],
  allowPatientSelect = false,
  title = 'Medical report',
  description = 'Preview or download a PDF with letterhead, executive summary, medications, CBP, lipid and liver panels (all time), session history, and care guidance for the selected period.',
}: MedicalReportDownloadProps) {
  const { toast } = useToast();
  const [days, setDays] = useState<ReportDayRange>(7);
  const [reportType, setReportType] = useState<MedicalReportType>('summary');
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId);
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const effectivePatientId = allowPatientSelect ? selectedPatientId : defaultPatientId;
  const effectiveName =
    patientName ||
    patients.find((p) => p.id === effectivePatientId)?.name ||
    'patient';

  const reportTypeLabel = reportType === 'summary' ? 'Summary' : 'Detailed';

  const handlePreview = async () => {
    if (!effectivePatientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    setPreviewing(true);
    try {
      const blob = await fetchMedicalReportPdf(effectivePatientId, days, reportType, 'inline');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast({
        title: 'Report opened',
        description: `${reportTypeLabel} report for last ${days} days opened in a new tab.`,
      });
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

  const handleDownload = async () => {
    if (!effectivePatientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    setDownloading(true);
    try {
      await downloadMedicalReport(effectivePatientId, days, effectiveName, reportType);
      toast({
        title: 'Report downloaded',
        description: `${reportTypeLabel} report (last ${days} days) saved as PDF.`,
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

  const busy = downloading || previewing;

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
          <div className="space-y-2 sm:w-44">
            <Label>Report type</Label>
            <Select
              value={reportType}
              onValueChange={(v) => setReportType(v as MedicalReportType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary report</SelectItem>
                <SelectItem value="detailed">Detailed report</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={busy || !effectivePatientId}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewing ? 'Generating…' : 'Preview PDF'}
          </Button>
          <Button onClick={handleDownload} disabled={busy || !effectivePatientId}>
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Generating…' : 'Download PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
