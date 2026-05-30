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
import { Download, FileText } from 'lucide-react';
import { downloadMedicalReport } from '@/services/api';
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
  title = 'Medical report summary',
  description = 'Download a PDF with letterhead, AI executive summary, CBP labs, URR (urea reduction ratio), session history, nutrition, fluid, and care guidance for the selected period.',
}: MedicalReportDownloadProps) {
  const { toast } = useToast();
  const [days, setDays] = useState<ReportDayRange>(7);
  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId);
  const [downloading, setDownloading] = useState(false);

  const effectivePatientId = allowPatientSelect ? selectedPatientId : defaultPatientId;
  const effectiveName =
    patientName ||
    patients.find((p) => p.id === effectivePatientId)?.name ||
    'patient';

  const handleDownload = async () => {
    if (!effectivePatientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    setDownloading(true);
    try {
      await downloadMedicalReport(effectivePatientId, days, effectiveName);
      toast({ title: 'Report downloaded', description: `Last ${days} days summary saved as PDF.` });
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

  return (
    <Card className="shadow-clinical border-primary/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
        {allowPatientSelect && patients.length > 0 && (
          <div className="flex-1 space-y-2">
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
        <Button onClick={handleDownload} disabled={downloading || !effectivePatientId} className="sm:mb-0">
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Generating…' : 'Download PDF'}
        </Button>
      </CardContent>
    </Card>
  );
}
