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

type MedicalReportPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  title: string;
  subtitle?: string;
  onDownload?: () => void;
  downloading?: boolean;
};

/** In-tab PDF preview popup for medical reports. */
export function MedicalReportPreviewDialog({
  open,
  onOpenChange,
  pdfUrl,
  title,
  subtitle,
  onDownload,
  downloading = false,
}: MedicalReportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[min(1100px,95vw)] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pb-3 pt-6">
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <div className="min-h-0 flex-1 px-6 pb-2">
          {pdfUrl ? (
            <iframe
              title={title}
              src={pdfUrl}
              className="h-full w-full rounded-md border bg-muted/20"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
              Preparing preview…
            </div>
          )}
        </div>
        <DialogFooter className="shrink-0 px-6 pb-6 pt-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onDownload && (
            <Button type="button" onClick={onDownload} disabled={downloading || !pdfUrl}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Downloading…' : 'Download PDF'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
