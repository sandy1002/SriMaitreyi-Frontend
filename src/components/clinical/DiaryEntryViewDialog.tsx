import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type DiaryEntryViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  subtitle?: string;
  onLoadIntoForm: () => void;
  children: React.ReactNode;
};

/** Read-only preview of a saved diary day; optional load into the edit form. */
export function DiaryEntryViewDialog({
  open,
  onOpenChange,
  dateLabel,
  subtitle,
  onLoadIntoForm,
  children,
}: DiaryEntryViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dateLabel}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <div className="text-sm space-y-3 py-1">{children}</div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onLoadIntoForm();
              onOpenChange(false);
            }}
          >
            Load into form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
