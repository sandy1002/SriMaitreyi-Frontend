import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  ArrowLeft,
  Calendar,
  Building2,
  FileText,
  Paperclip,
  Sparkles,
  Send,
  Upload,
  Image,
  FileIcon,
  Music,
  Clock,
  CheckCircle,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import * as api from '@/services/api';
import { SessionAttachment } from '@/types';

/* ---------------------------------------
   Safe Date Formatter (CRITICAL)
--------------------------------------- */
function safeFormat(
  value?: string | Date | null,
  fmt = 'EEEE, MMMM d, yyyy'
) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return '—';
  return format(date, fmt);
}

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated, user } = useAuth();
  const {
    currentSession,
    notes,
    attachments,
    loadSessionDetails,
    addNote,
    closeSession,
  } = useSession();

  const navigate = useNavigate();
  const { toast } = useToast();

  // File inputs for different attachment types
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [closing, setClosing] = useState(false);

  // Local attachment state so we can append newly uploaded files
  const [allAttachments, setAllAttachments] = useState<SessionAttachment[]>(
    attachments ?? []
  );
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails(sessionId);
    }
  }, [sessionId]);

  // Keep local attachments in sync with context when session details reload
  useEffect(() => {
    setAllAttachments(attachments ?? []);
  }, [attachments]);

  const session = currentSession;

  const photoAttachments =
    allAttachments?.filter((a) => a.fileType === 'image') ?? [];

  const audioAttachments =
    allAttachments?.filter((a) => a.fileType === 'audio') ?? [];

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-6 text-center">
          <p className="text-muted-foreground">Loading session...</p>
          <Button
            variant="soft"
            className="mt-4"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  const isPatient = user?.role === 'patient';
  const isCompleted = session.status === 'completed';

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      await addNote(session.id, noteText);
      setNoteText('');
      toast({
        title: 'Note Added',
        description: 'Your session note has been saved.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add note.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'audio':
        return <Music className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  /**
   * Upload a file and append it to local attachment state.
   * target:
   *  - 'attachments': generic file (image, audio, pdf)
   *  - 'photos': image only
   *  - 'audio': audio only
   */
  const handleAttachmentUpload = async (
    file: File,
    target: 'attachments' | 'photos' | 'audio'
  ) => {
    if (!session) return;

    let fileType: 'image' | 'pdf' | 'audio';

    if (target === 'photos' || file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (target === 'audio' || file.type.startsWith('audio/')) {
      fileType = 'audio';
    } else {
      // Fallback for documents/other
      fileType = 'pdf';
    }

    setIsUploadingAttachment(true);
    try {
      const newAttachment: SessionAttachment = await api.uploadAttachment(
        session.id,
        file,
        fileType
      );

      setAllAttachments((prev) => [...prev, newAttachment]);

      toast({
        title: 'Attachment uploaded',
        description: `${file.name} has been uploaded.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload attachment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Session Header */}
        <Card>
          <CardContent className="p-6 flex justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Calendar className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {safeFormat(
                    // BE can return either camelCase or snake_case
                    (session as any).sessionDate ?? (session as any).session_date
                  )}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {(session as any).hospitalName ?? (session as any).hospital_name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge>
                {isCompleted ? 'Completed' : 'In Progress'}
              </Badge>

              {!isCompleted && isPatient && (
                <Button
                  disabled={closing}
                  onClick={async () => {
                    setClosing(true);
                    await closeSession(session.id);
                    toast({
                      title: 'Session Closed',
                      description: 'Your dialysis session is completed.',
                    });
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Close Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes / Attachments / Photos / Audio */}
        <Tabs defaultValue="notes">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="attachments">All Attachments</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="audio">Audio Session</TabsTrigger>
          </TabsList>

          {/* NOTES TAB */}
          <TabsContent value="notes" className="space-y-4">
            {/* Add Note Section – Patient Only */}
            {isPatient && !isCompleted && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Add Session Note
                  </CardTitle>
                  <CardDescription>
                    Describe what happened during your dialysis session
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Felt dizzy after 2 hours, nurse administered saline..."
                    rows={4}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || isSubmittingNote}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmittingNote ? 'Saving...' : 'Add Note'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Notes List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Session Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length ? (
                  <ScrollArea className="h-72 pr-4">
                    {notes.map((note: any) => (
                      <div
                        key={note.id}
                        className="p-4 border rounded mb-3"
                      >
                        <p>{note.note_text}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {safeFormat(
                            note.created_at,
                            'MMM d, yyyy h:mm a'
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground text-center py-6">
                    No notes recorded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ALL ATTACHMENTS TAB */}
          <TabsContent value="attachments" className="space-y-4">
            {isPatient && !isCompleted && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  <span>Upload reports, prescriptions, and other files.</span>
                </div>
                <div>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAttachmentUpload(file, 'attachments');
                        // clear input so same file can be re-selected if needed
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAttachment}
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingAttachment ? 'Uploading...' : 'Upload Attachment'}
                  </Button>
                </div>
              </div>
            )}

            {allAttachments.length ? (
              <div className="space-y-3">
                {allAttachments.map((a) => (
                  <div
                    key={a.id}
                    className="flex gap-3 p-3 border rounded items-center"
                  >
                    {getFileIcon(a.fileType)}
                    <div>
                      <p className="font-medium">{a.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.fileType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">
                No attachments uploaded
              </p>
            )}
          </TabsContent>

          {/* PHOTOS TAB */}
          <TabsContent value="photos" className="space-y-4">
            {isPatient && !isCompleted && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Image className="h-4 w-4" />
                  <span>Upload session-related photos.</span>
                </div>
                <div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAttachmentUpload(file, 'photos');
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAttachment}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingAttachment ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                </div>
              </div>
            )}

            {photoAttachments.length ? (
              <div className="space-y-3">
                {photoAttachments.map((a) => (
                  <div key={a.id} className="flex gap-3 p-3 border rounded">
                    {getFileIcon(a.fileType)}
                    <div>
                      <p>{a.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.fileType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">
                No photos uploaded for this session
              </p>
            )}
          </TabsContent>

          {/* AUDIO TAB */}
          <TabsContent value="audio" className="space-y-4">
            {isPatient && !isCompleted && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="h-4 w-4" />
                  <span>Upload audio notes or recordings.</span>
                </div>
                <div>
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAttachmentUpload(file, 'audio');
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAttachment}
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploadingAttachment ? 'Uploading...' : 'Upload Audio'}
                  </Button>
                </div>
              </div>
            )}

            {audioAttachments.length ? (
              <div className="space-y-3">
                {audioAttachments.map((a) => (
                  <div key={a.id} className="flex gap-3 p-3 border rounded">
                    {getFileIcon(a.fileType)}
                    <div>
                      <p>{a.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.fileType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">
                No audio files uploaded for this session
              </p>
            )}
          </TabsContent>

          {/* SUMMARY TAB (if you enable it later) */}
          <TabsContent value="summary">
            {session.summary ? (
              <p>{session.summary}</p>
            ) : (
              <p className="text-muted-foreground text-center">
                Summary will be generated after completion
              </p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}