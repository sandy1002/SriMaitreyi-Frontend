import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  deleteHealthHistoryAttachment,
  fetchHealthHistory,
  uploadHealthHistoryDocument,
} from '@/services/api';
import type { HealthHistoryAttachment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FileUp, FolderOpen, Loader2, Trash2 } from 'lucide-react';

interface MedicalRecordsUploadProps {
  patientId: string;
  canEdit?: boolean;
  title?: string;
  description?: string;
}

export function MedicalRecordsUpload({
  patientId,
  canEdit = true,
  title = 'Past medical records',
  description = 'Upload hospital reports, lab results, discharge summaries, or scanned forms (PDF or image). Files are stored securely for your care team.',
}: MedicalRecordsUploadProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<HealthHistoryAttachment[]>([]);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const data = await fetchHealthHistory(patientId);
      setAttachments(data.attachments ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !patientId) return;
    setUploading(true);
    try {
      await uploadHealthHistoryDocument(patientId, file);
      await load();
      toast({ title: 'Document uploaded', description: file.name });
    } catch (err) {
      console.error(err);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!patientId) return;
    try {
      await deleteHealthHistoryAttachment(patientId, attachmentId);
      await load();
      toast({ title: 'Document removed' });
    } catch {
      toast({ title: 'Could not remove document', variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-clinical border-dashed border-primary/25">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileUp className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {canEdit && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              disabled={uploading || loading}
              onChange={handleUpload}
              className="max-w-md"
            />
            {uploading && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading documents…
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <FolderOpen className="h-4 w-4 shrink-0" />
            No documents on file yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
              >
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline truncate mr-2"
                >
                  {att.file_name}
                </a>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(att.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
