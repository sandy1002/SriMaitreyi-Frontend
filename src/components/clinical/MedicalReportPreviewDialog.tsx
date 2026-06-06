import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PdfDocumentPreview } from '@/components/clinical/PdfDocumentPreview';

type MedicalReportPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfBlob: Blob | null;
  title: string;
  subtitle?: string;
  onDownload?: () => void;
  downloading?: boolean;
};

/** In-tab PDF preview popup for medical reports. */
export function MedicalReportPreviewDialog({
  open,
  onOpenChange,
  pdfBlob,
  title,
  subtitle,
  onDownload,
  downloading = false,
}: MedicalReportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-[100vw] max-w-[100vw] flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[90vh] sm:max-h-[90vh] sm:w-[min(1100px,95vw)] sm:max-w-[95vw] sm:rounded-lg sm:border">
        <DialogHeader className="shrink-0 px-4 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-6">
          <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <div className="min-h-0 flex-1 px-3 pb-2 sm:px-6">
          {pdfBlob ? (
            <PdfDocumentPreview blob={pdfBlob} className="h-full" />
          ) : (
            <div className="flex h-full items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
              Preparing preview…
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 gap-2 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onDownload && (
            <Button type="button" onClick={onDownload} disabled={downloading || !pdfBlob}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Downloading…' : 'Download PDF'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
