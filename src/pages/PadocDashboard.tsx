import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileScan,
  FileSpreadsheet,
  FileText,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { usePadocAuth } from '@/context/PadocAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PadocIngestPreviewPanel } from '@/components/padoc/PadocIngestPreview';
import {
  PADOC_INGEST_ACCEPT,
  PADOC_INGEST_MAX_BYTES,
  createPadocDocument,
  deletePadocDocument,
  fetchPadocDocuments,
  padocFileAbsoluteUrl,
  padocIngestFileError,
  previewPadocIngest,
  type PadocDocument,
  type PadocIngestPreview,
} from '@/services/padocApi';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(file: File): 'pdf' | 'image' | 'spreadsheet' | 'doc' | 'other' {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp)$/.test(name)) return 'image';
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (/\.(xlsx|xls|csv)$/.test(name)) return 'spreadsheet';
  if (/\.(docx|doc)$/.test(name)) return 'doc';
  return 'other';
}

export default function PadocDashboard() {
  const { doctor, logout } = usePadocAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<PadocDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [ingestPreview, setIngestPreview] = useState<PadocIngestPreview | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [structuredJson, setStructuredJson] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PadocDocument | null>(null);

  const loadDocs = useCallback(async () => {
    if (!doctor?.id) return;
    setLoading(true);
    try {
      const items = await fetchPadocDocuments(doctor.id);
      setDocs(items);
    } catch (e) {
      toast({
        title: 'Could not load documents',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [doctor?.id, toast]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl(null);
      return;
    }
    const kind = fileKind(selectedFile);
    if (kind !== 'image' && kind !== 'pdf') {
      setLocalPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const selectedKind = useMemo(() => (selectedFile ? fileKind(selectedFile) : null), [selectedFile]);

  const handleFileChange = (file: File | null) => {
    setIngestPreview(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const error = padocIngestFileError(file);
    if (error) {
      toast({ title: 'Cannot use this file', description: error, variant: 'destructive' });
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleScan = async () => {
    if (!selectedFile) {
      toast({ title: 'Choose a file to classify', variant: 'destructive' });
      return;
    }
    const error = padocIngestFileError(selectedFile);
    if (error) {
      toast({ title: 'Cannot use this file', description: error, variant: 'destructive' });
      return;
    }
    setScanning(true);
    try {
      const result = await previewPadocIngest(selectedFile);
      setIngestPreview(result);
      toast({
        title: 'Preview ready',
        description: 'Classification complete. Nothing was saved.',
      });
    } catch (e) {
      toast({
        title: 'Scan failed',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setScanning(false);
    }
  };

  const handleSaveNote = async () => {
    if (!doctor?.id) return;
    if (!noteTitle.trim() && !noteBody.trim() && !structuredJson.trim()) {
      toast({ title: 'Enter a title, notes, or JSON', variant: 'destructive' });
      return;
    }
    let structuredData: unknown = undefined;
    if (structuredJson.trim()) {
      try {
        structuredData = JSON.parse(structuredJson);
      } catch {
        toast({ title: 'Structured JSON is invalid', variant: 'destructive' });
        return;
      }
    }
    setSavingNote(true);
    try {
      const item = await createPadocDocument(doctor.id, {
        title: noteTitle.trim() || 'Untitled note',
        dataKind: structuredData != null ? 'structured' : 'unstructured',
        notes: noteBody.trim() || undefined,
        structuredData,
      });
      toast({ title: 'Document saved' });
      setNoteTitle('');
      setNoteBody('');
      setStructuredJson('');
      await loadDocs();
      setSelectedDoc(item);
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (doc: PadocDocument) => {
    if (!doctor?.id) return;
    if (!window.confirm(`Delete “${doc.title}”?`)) return;
    try {
      await deletePadocDocument(doctor.id, doc.id);
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
      await loadDocs();
      toast({ title: 'Document deleted' });
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : undefined,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileScan className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold leading-none">PaDoc</p>
              <p className="text-xs text-slate-400">{doctor?.displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-slate-700 bg-transparent">
              <Link to="/login">Srimae dialysis</Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-300"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-1" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Doctor vault</h1>
          <p className="text-sm text-slate-400 mt-1">
            Classify PDFs, spreadsheets, Word files, and images. Scan preview is not saved to
            Postgres or the knowledge graph.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-50">
                <Upload className="h-5 w-5 text-emerald-400" />
                Document intake
              </CardTitle>
              <CardDescription className="text-slate-400">
                Choose a file first. Upload happens only when you click Scan / Classify.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="scan-file">File</Label>
                <Input
                  id="scan-file"
                  type="file"
                  accept={PADOC_INGEST_ACCEPT}
                  className="bg-slate-950 border-slate-700"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-slate-500">
                  PDF, Excel, Word, CSV, or jpeg/png/gif/webp. Max {formatFileSize(PADOC_INGEST_MAX_BYTES)}.
                </p>
              </div>

              {selectedFile ? (
                <div className="rounded-md border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                  {selectedKind === 'image' && localPreviewUrl ? (
                    <img
                      src={localPreviewUrl}
                      alt="Selected file preview"
                      className="max-h-48 rounded-md border border-slate-800 object-contain bg-slate-900"
                    />
                  ) : null}
                  {selectedKind === 'pdf' && localPreviewUrl ? (
                    <iframe
                      title="PDF preview"
                      src={localPreviewUrl}
                      className="h-48 w-full rounded-md border border-slate-800 bg-slate-900"
                    />
                  ) : null}
                  {selectedKind === 'spreadsheet' ? (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
                      Spreadsheet selected
                    </div>
                  ) : null}
                  {selectedKind === 'doc' ? (
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <FileText className="h-8 w-8 text-emerald-400" />
                      Word document selected
                    </div>
                  ) : null}
                </div>
              ) : null}

              <Button type="button" onClick={handleScan} disabled={scanning || !selectedFile}>
                {scanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <FileScan className="h-4 w-4 mr-2" />
                    Scan / Classify
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-50">
                <Plus className="h-5 w-5 text-emerald-400" />
                Add note / structured data
              </CardTitle>
              <CardDescription className="text-slate-400">
                Free-text notes and optional JSON for structured records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="bg-slate-950 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-body">Unstructured notes</Label>
                <Textarea
                  id="note-body"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={4}
                  className="bg-slate-950 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-json">Structured JSON (optional)</Label>
                <Textarea
                  id="note-json"
                  value={structuredJson}
                  onChange={(e) => setStructuredJson(e.target.value)}
                  rows={4}
                  placeholder='{"key": "value"}'
                  className="bg-slate-950 border-slate-700 font-mono text-xs"
                />
              </div>
              <Button type="button" onClick={handleSaveNote} disabled={savingNote}>
                {savingNote ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save to vault'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {scanning ? (
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="py-10 flex items-center justify-center gap-2 text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Classifying document…
            </CardContent>
          </Card>
        ) : null}

        {ingestPreview && !scanning ? (
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-slate-50">Intake preview</CardTitle>
              <CardDescription className="text-slate-400">
                Result of /ingest/preview. Not written to storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PadocIngestPreviewPanel preview={ingestPreview} />
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-slate-50">Your documents</CardTitle>
              <CardDescription className="text-slate-400">
                {loading ? 'Loading…' : `${docs.length} item${docs.length === 1 ? '' : 's'}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
              {!loading && docs.length === 0 && (
                <p className="text-sm text-slate-500">No documents yet. Add a note to the vault.</p>
              )}
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-start justify-between gap-2 rounded-md border p-3 cursor-pointer ${
                    selectedDoc?.id === doc.id
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                  onClick={() => setSelectedDoc(doc)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedDoc(doc);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="font-medium text-sm truncate">{doc.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {doc.dataKind}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—'}
                      {doc.fileName ? ` · ${doc.fileName}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-slate-400 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc);
                    }}
                    aria-label={`Delete ${doc.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg text-slate-50">Vault item</CardTitle>
              <CardDescription className="text-slate-400">
                Saved notes from this portal (separate from intake preview).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedDoc ? (
                <p className="text-sm text-slate-500">Select a saved document.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-base">{selectedDoc.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedDoc.dataKind} · status {selectedDoc.reviewStatus}
                    </p>
                  </div>
                  {selectedDoc.notes ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Notes</p>
                      <p className="whitespace-pre-wrap text-slate-200">{selectedDoc.notes}</p>
                    </div>
                  ) : null}
                  {selectedDoc.fileUrl ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">File</p>
                      <a
                        className="text-emerald-400 underline"
                        href={padocFileAbsoluteUrl(selectedDoc.fileUrl) ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedDoc.fileName || 'Open file'}
                      </a>
                    </div>
                  ) : null}
                  {selectedDoc.structuredData != null || selectedDoc.extractedPanels != null ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                        Structured / extracted
                      </p>
                      <pre className="max-h-72 overflow-auto rounded-md bg-slate-950 border border-slate-800 p-3 text-xs text-slate-300">
                        {JSON.stringify(
                          selectedDoc.structuredData ?? selectedDoc.extractedPanels,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
