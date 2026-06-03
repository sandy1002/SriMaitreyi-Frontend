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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
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
  Trash2,
  Pencil,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { formatIST } from '@/lib/datetime';
import * as api from '@/services/api';
import { SessionAttachment } from '@/types';
import { AlertsPanel } from '@/components/clinical/AlertsPanel';
import { SessionVitalsWorkflow } from '@/components/clinical/SessionVitalsWorkflow';
import { SessionMedicationSection } from '@/components/clinical/SessionMedicationSection';
import { SessionEditDialog } from '@/components/clinical/SessionEditDialog';
import {
  formatUfGoal,
  formatVolumeFromMl,
} from '@/lib/clinicalUnits';
import type { InterdialyticFluidsSummary } from '@/types';

/* ---------------------------------------
   Safe Date Formatter (CRITICAL)
--------------------------------------- */
function safeFormat(value?: string | Date | null, mode: 'date' | 'datetime' = 'date') {
  if (!value) return '—';
  if (mode === 'datetime') return formatIST(value);
  return formatIST(value, { timeZone: 'Asia/Kolkata', dateStyle: 'full' });
}

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated, user, isAdmin } = useAuth();
  const {
    currentSession,
    notes,
    attachments,
    alerts,
    checks,
    vitalReadings,
    medicationIntakes,
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
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  // post-dialysis form fields
  const [postWeight, setPostWeight] = useState<string>('');
  const [postBp, setPostBp] = useState<string>('');
  const [totalUf, setTotalUf] = useState<string>('');
  const [condition, setCondition] = useState<'Stable' | 'Unstable'>('Stable');
  const [technicianName, setTechnicianName] = useState('');
  const [nurseName, setNurseName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [postPotassium, setPostPotassium] = useState('');
  const [postBloodSugar, setPostBloodSugar] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [postKOnly, setPostKOnly] = useState('');
  const [savingPostK, setSavingPostK] = useState(false);

  // Local attachment state so we can append newly uploaded files
  const [allAttachments, setAllAttachments] = useState<SessionAttachment[]>(
    attachments ?? []
  );
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [interdialyticFluids, setInterdialyticFluids] =
    useState<InterdialyticFluidsSummary | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (sessionId) {
      loadSessionDetails(sessionId);
    }
  }, [sessionId]);

  useEffect(() => {
    const pre = currentSession?.preDialysisAssessment;
    const post = currentSession?.postDialysisAssessment;
    if (!pre && !post) return;
    if (!post?.technicianName && pre?.technicianName) setTechnicianName(pre.technicianName);
    if (!post?.nurseName && pre?.nurseName) setNurseName(pre.nurseName);
    if (!post?.doctorName && pre?.doctorName) setDoctorName(pre.doctorName);
  }, [currentSession?.id, currentSession?.preDialysisAssessment, currentSession?.postDialysisAssessment]);

  useEffect(() => {
    const s = currentSession;
    if (!s?.patientId || !s?.sessionDate) return;
    api
      .fetchInterdialyticFluids(s.patientId, s.sessionDate)
      .then(setInterdialyticFluids)
      .catch(() => setInterdialyticFluids(null));
  }, [currentSession?.patientId, currentSession?.sessionDate]);

  // Keep local attachments in sync with context when session details reload
  useEffect(() => {
    setAllAttachments(attachments ?? []);
  }, [attachments]);

  const session = currentSession;
  const assessment = session?.preDialysisAssessment;
  const postAssessment = session?.postDialysisAssessment;

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
  const isTechnician = user?.role === 'technician';
  const isCompleted = session.status === 'completed';
  const canManageSession = (isPatient || isTechnician) && !isCompleted;
  const isPostDialysis = session.status === 'post-dialysis';
  const isInProgress = session.status === 'in-progress';
  const isSessionOpen = !isCompleted;

  const handleDeleteSession = async () => {
    if (!session) return;
    setDeletingSession(true);
    try {
      await api.deleteSession(session.id);
      toast({ title: 'Session deleted' });
      navigate(isAdmin ? '/admin' : isTechnician ? '/staff' : '/dashboard');
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingSession(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const result = await addNote(session.id, noteText);
      setNoteText('');
      toast({
        title: 'Note Added',
        description:
          result.alerts.length > 0
            ? `Note saved. ${result.alerts.length} new alert(s) to review.`
            : 'Your session note has been saved.',
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
          onClick={() => navigate(isAdmin ? '/admin' : isTechnician ? '/staff' : '/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isAdmin ? 'Back to Admin' : 'Back to Dashboard'}
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
                {assessment && (
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">UF goal: </span>
                    <span className="font-semibold text-foreground">{formatUfGoal(assessment)}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <Badge>
                {isCompleted
                  ? 'Completed'
                  : isPostDialysis
                    ? 'Awaiting Post K'
                    : 'In Progress'}
              </Badge>

              {canManageSession && (
                <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit session
                </Button>
              )}

              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={deletingSession}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete session
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Permanently removes notes, attachments, and assessments for this session.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDeleteSession}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isInProgress && canManageSession && (
                <>
                  <Button
                    disabled={closing}
                    onClick={() => setCloseDialogOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    End Dialysis
                  </Button>

                  <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>End dialysis</DialogTitle>
                        <DialogDescription>
                          Record post-dialysis vitals and staff. The session stays open until Post K
                          is entered at your next visit (or below if known now).
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-3 py-2">
                        {formError && (
                          <p className="text-sm text-destructive">{formError}</p>
                        )}

                        <div className="grid sm:grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="postWeight">Post Weight (kg)</Label>
                            <Input id="postWeight" type="number" value={postWeight} onChange={e => setPostWeight(e.target.value)} />
                          </div>

                          <div>
                            <Label htmlFor="postBp">Post BP</Label>
                            <Input id="postBp" type="text" value={postBp} onChange={e => setPostBp(e.target.value)} />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="totalUf">Total UF Removed (L)</Label>
                            <Input id="totalUf" type="number" value={totalUf} onChange={e => setTotalUf(e.target.value)} />
                          </div>
                          <div>
                            <Label htmlFor="condition">Condition</Label>
                            <select id="condition" className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" value={condition} onChange={e => setCondition(e.target.value as 'Stable' | 'Unstable')}>
                              <option value="Stable">Stable</option>
                              <option value="Unstable">Unstable</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor="technician">Technician Name</Label>
                            <Input id="technician" value={technicianName} onChange={e => setTechnicianName(e.target.value)} />
                          </div>
                          <div>
                            <Label htmlFor="nurse">Nurse Name</Label>
                            <Input id="nurse" value={nurseName} onChange={e => setNurseName(e.target.value)} />
                          </div>
                          <div>
                            <Label htmlFor="doctor">Doctor Name</Label>
                            <Input id="doctor" value={doctorName} onChange={e => setDoctorName(e.target.value)} />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="postK">Potassium — Post K (mmol/L)</Label>
                            <Input
                              id="postK"
                              type="number"
                              step="0.1"
                              value={postPotassium}
                              onChange={(e) => setPostPotassium(e.target.value)}
                              placeholder="Optional now — required before next session"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postGlucose">Glucose / Sugar (mg/dL)</Label>
                            <Input
                              id="postGlucose"
                              type="number"
                              step="1"
                              min={0}
                              value={postBloodSugar}
                              onChange={(e) => setPostBloodSugar(e.target.value)}
                              placeholder="Optional — end of session"
                            />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
                          <Button onClick={async () => {
                            // validate required fields
                            if (!postWeight || !postBp || !totalUf || !technicianName || !nurseName || !doctorName) {
                              setFormError('All fields are required before closing the session.');
                              return;
                            }
                            setFormError(null);
                            setClosing(true);
                            try {
                              const result = await closeSession(session.id, {
                                postWeightKg: Number(postWeight),
                                postBp: postBp,
                                totalUfRemoved: Number(totalUf),
                                condition,
                                technicianName,
                                nurseName,
                                doctorName,
                                postPotassiumMmolL: postPotassium
                                  ? Number(postPotassium)
                                  : undefined,
                                postBloodSugar: postBloodSugar
                                  ? Number(postBloodSugar)
                                  : undefined,
                              });

                              await loadSessionDetails(session.id);
                              toast({
                                title: result.session.status === 'completed'
                                  ? 'Session completed'
                                  : 'Dialysis ended',
                                description:
                                  result.session.status === 'completed'
                                    ? 'Post K recorded — session is complete.'
                                    : 'Session stays open until Post K is entered at your next visit.',
                              });
                              setCloseDialogOpen(false);
                            } catch (err) {
                              console.error(err);
                              toast({ title: 'Error', description: 'Failed to close session.', variant: 'destructive' });
                            } finally {
                              setClosing(false);
                            }
                          }} disabled={closing}>{closing ? 'Saving...' : 'End dialysis'}</Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {(alerts.length > 0 || checks.length > 0) && (
          <Card>
            <CardContent className="p-6">
              <AlertsPanel alerts={alerts} checks={checks} />
            </CardContent>
          </Card>
        )}

        <SessionVitalsWorkflow
          sessionId={session.id}
          isCompleted={!isInProgress}
          initialReadings={vitalReadings}
          onAlertsUpdated={() => loadSessionDetails(session.id)}
        />

        <SessionMedicationSection
          sessionId={session.id}
          sessionDate={session.sessionDate}
          readOnly={isCompleted}
          initialIntakes={medicationIntakes}
          onUpdated={() => loadSessionDetails(session.id)}
        />

        {isPostDialysis && canManageSession && (
          <Card className="border-amber-500/40">
            <CardHeader>
              <CardTitle className="text-lg">Post K — complete session</CardTitle>
              <CardDescription>
                Enter Post K when available. The session remains open until this is saved or you
                start a new session.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input
                type="number"
                step="0.1"
                placeholder="Post K (mmol/L)"
                value={postKOnly}
                onChange={(e) => setPostKOnly(e.target.value)}
                className="max-w-xs"
              />
              <Button
                disabled={!postKOnly || savingPostK}
                onClick={async () => {
                  setSavingPostK(true);
                  try {
                    await api.updatePostPotassium(session.id, Number(postKOnly));
                    await loadSessionDetails(session.id);
                    setPostKOnly('');
                    toast({ title: 'Post K saved — session completed' });
                  } catch {
                    toast({ title: 'Failed to save Post K', variant: 'destructive' });
                  } finally {
                    setSavingPostK(false);
                  }
                }}
              >
                {savingPostK ? 'Saving...' : 'Save Post K'}
              </Button>
            </CardContent>
          </Card>
        )}

        <Accordion type="single" collapsible className="pt-2">
          <AccordionItem value="pre-dialysis">
            <AccordionTrigger className="text-lg font-medium">
              Pre-Dialysis Assessment
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                Assessment values recorded when the session was started.
              </p>

              <div className="mt-3 space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Weight (kg): </span>
                  <span className="font-semibold">{assessment?.weightKg ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Blood Pressure: </span>
                  <span className="font-semibold">{assessment?.bloodPressure || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Potassium (Pre K): </span>
                  <span className="font-semibold">
                    {assessment?.potassiumMmolL != null
                      ? `${assessment.potassiumMmolL} mmol/L`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pulse: </span>
                  <span className="font-semibold">{assessment?.pulse ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Temperature: </span>
                  <span className="font-semibold">{assessment?.temperature ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Glucose / Sugar (mg/dL): </span>
                  <span className="font-semibold">{assessment?.bloodSugar ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Access Condition: </span>
                  <span className="font-semibold">{assessment?.accessCondition || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Technician: </span>
                  <span className="font-semibold">
                    {assessment?.technicianName || postAssessment?.technicianName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nurse: </span>
                  <span className="font-semibold">
                    {assessment?.nurseName || postAssessment?.nurseName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Doctor: </span>
                  <span className="font-semibold">
                    {assessment?.doctorName || postAssessment?.doctorName || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Target dry weight: </span>
                  <span className="font-semibold">
                    {assessment?.targetDryWeightKg != null
                      ? `${assessment.targetDryWeightKg} kg`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">IDWG: </span>
                  <span className="font-semibold">
                    {assessment?.idwgKg != null ? `${assessment.idwgKg} kg` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">UF goal: </span>
                  <span className="font-semibold">{formatUfGoal(assessment)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fluids during treatment: </span>
                  <span className="font-semibold">
                    {assessment?.fluidAddedLiters != null
                      ? `${assessment.fluidAddedLiters} L`
                      : '—'}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium">Treatment fluids (per entry)</p>
              <ul className="mt-2 space-y-1 text-sm border rounded-lg divide-y">
                <li className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">Prime / rinseback</span>
                  <span className="font-medium">
                    {assessment?.primeRinsebackMl != null
                      ? `${assessment.primeRinsebackMl} ml`
                      : '—'}
                  </span>
                </li>
                <li className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">IV fluids</span>
                  <span className="font-medium">
                    {assessment?.ivFluidsMl != null ? `${assessment.ivFluidsMl} ml` : '—'}
                  </span>
                </li>
                <li className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">Oral during session</span>
                  <span className="font-medium">
                    {assessment?.oralIntakeMl != null ? `${assessment.oralIntakeMl} ml` : '—'}
                  </span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {interdialyticFluids && interdialyticFluids.dailyEntries.length > 0 && (
            <AccordionItem value="interdialytic-fluids">
              <AccordionTrigger className="text-lg font-medium">
                Interdialytic fluids (since last session)
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-2">
                  From renal fluid diary after session on{' '}
                  {interdialyticFluids.lastSessionDate ?? '—'} through{' '}
                  {interdialyticFluids.untilDate} (exclusive). Remove values are applied to UF
                  calculation at session start.
                </p>
                <p className="text-sm font-medium mb-3">
                  Total: {interdialyticFluids.totalLiters} L ({interdialyticFluids.totalMl} ml)
                  {' · '}oral {interdialyticFluids.totalOralMl} ml · IV{' '}
                  {interdialyticFluids.totalIvMl} ml
                </p>
                {interdialyticFluids.dailyEntries.map((day) => (
                  <div key={day.diaryDate} className="mb-4 border rounded-lg p-3">
                    <p className="font-medium text-sm mb-2">{day.diaryDate}</p>
                    <ul className="space-y-1 text-sm">
                      {day.intakes.map((line) => (
                        <li key={line.id} className="flex justify-between gap-2">
                          <span className="text-muted-foreground capitalize">
                            {line.category.replace('_', ' ')}
                            {line.description ? ` — ${line.description}` : ''}
                          </span>
                          <span className="font-medium shrink-0">
                            {formatVolumeFromMl(line.volumeMl, line.volumeUnit)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {postAssessment && (
          <Accordion type="single" collapsible className="pt-2">
            <AccordionItem value="post-dialysis">
              <AccordionTrigger className="text-lg font-medium">
                Post-Dialysis Assessment
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">
                  Values recorded when dialysis ended.
                </p>

                <div className="mt-3 space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Post Weight (kg): </span>
                    <span className="font-semibold">{postAssessment?.postWeightKg ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Post BP: </span>
                    <span className="font-semibold">{postAssessment?.postBp || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Potassium (Post K): </span>
                    <span className="font-semibold">
                      {postAssessment?.postPotassiumMmolL != null
                        ? `${postAssessment.postPotassiumMmolL} mmol/L`
                        : isPostDialysis
                          ? 'Pending — enter before next session'
                          : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Glucose / Sugar (mg/dL): </span>
                    <span className="font-semibold">
                      {postAssessment?.postBloodSugar ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total UF removed: </span>
                    <span className="font-semibold">
                      {postAssessment?.totalUfRemoved != null
                        ? `${postAssessment.totalUfRemoved} L`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Condition: </span>
                    <span className="font-semibold">{postAssessment?.condition || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Technician Name: </span>
                    <span className="font-semibold">{postAssessment?.technicianName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nurse Name: </span>
                    <span className="font-semibold">{postAssessment?.nurseName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Doctor Name: </span>
                    <span className="font-semibold">{postAssessment?.doctorName || '—'}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Notes / Attachments / Photos / Audio */}
        <Tabs defaultValue="notes">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="attachments">All Attachments</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="audio">Audio Session</TabsTrigger>
            {isCompleted && <TabsTrigger value="summary">Summary</TabsTrigger>}
          </TabsList>

          {/* NOTES TAB */}
          <TabsContent value="notes" className="space-y-4">
            {/* Add Note Section – Patient Only */}
            {canManageSession && isSessionOpen && (
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
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 border rounded mb-3"
                      >
                        <p>{note.noteText}</p>
                        <div className="text-xs text-muted-foreground mt-2">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {safeFormat(note.createdAt, 'datetime')}
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
            {canManageSession && isSessionOpen && (
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
                    <div className="flex-1">
                      <p className="font-medium">{a.fileName}</p>
                      <p className="text-xs text-muted-foreground">{a.fileType}</p>
                      {a.fileUrl && (
                        <a
                          href={a.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary underline"
                        >
                          View file
                        </a>
                      )}
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
            {canManageSession && isSessionOpen && (
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
            {canManageSession && isSessionOpen && (
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

      {session && (
        <SessionEditDialog
          session={session}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSaved={async () => {
            if (sessionId) await loadSessionDetails(sessionId);
            toast({ title: 'Session updated' });
          }}
        />
      )}
    </div>
  );
}