import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { fetchPatientsOverview, deleteSession, createPatient, deletePatient, updatePatientPortalCredentials } from '@/services/api';
import { MedicalReportDownload } from '@/components/clinical/MedicalReportDownload';
import type { PatientOverview } from '@/types';
import {
  Users,
  Calendar,
  FileText,
  AlertTriangle,
  Trash2,
  ExternalLink,
  RefreshCw,
  UserPlus,
  ClipboardList,
  BookOpen,
  KeyRound,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatISTDate } from '@/lib/datetime';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminDashboard() {
  const { isAdmin, isAuthenticated, refreshPatients } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [overview, setOverview] = useState<PatientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState<string>('');
  const [newLoginUsername, setNewLoginUsername] = useState('');
  const [newLoginPassword, setNewLoginPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);
  const [reportPatientId, setReportPatientId] = useState('');
  const [credPatient, setCredPatient] = useState<PatientOverview | null>(null);
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [savingCreds, setSavingCreds] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPatientsOverview();
      setOverview(data.patients);
      if (!reportPatientId && data.patients[0]) {
        setReportPatientId(data.patients[0].id);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to load patients', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }
    load();
  }, [isAuthenticated, isAdmin]);

  const handleAddPatient = async () => {
    if (!newName.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    if (newLoginPassword && newLoginPassword.length < 4) {
      toast({ title: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    setAddingPatient(true);
    try {
      const created = await createPatient({
        name: newName.trim(),
        age: newAge ? Number(newAge) : undefined,
        gender: newGender || undefined,
        email: newEmail.trim() || undefined,
        login_username: newLoginUsername.trim() || undefined,
        login_password: newLoginPassword || undefined,
      });
      const loginHint = created.loginUsername
        ? ` Login username: ${created.loginUsername}`
        : '';
      const pwHint = created.mustChangePassword
        ? ' Patient must change password on first login.'
        : '';
      toast({
        title: 'Patient added',
        description: `${newName} is now registered.${loginHint}${pwHint}`,
      });
      setNewName('');
      setNewAge('');
      setNewGender('');
      setNewEmail('');
      setNewLoginUsername('');
      setNewLoginPassword('');
      setAddDialogOpen(false);
      await refreshPatients();
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to add patient', variant: 'destructive' });
    } finally {
      setAddingPatient(false);
    }
  };

  const handleDeletePatient = async (patient: PatientOverview) => {
    setDeletingPatientId(patient.id);
    try {
      const result = await deletePatient(patient.id);
      toast({
        title: 'Patient deleted',
        description:
          result.sessions_removed && result.sessions_removed > 0
            ? `Removed ${patient.name} and ${result.sessions_removed} session(s).`
            : `Removed ${patient.name}.`,
      });
      await refreshPatients();
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to delete patient', variant: 'destructive' });
    } finally {
      setDeletingPatientId(null);
    }
  };

  const openCredDialog = (patient: PatientOverview) => {
    setCredPatient(patient);
    setCredUsername(patient.loginUsername ?? '');
    setCredPassword('');
  };

  const handleSaveCredentials = async () => {
    if (!credPatient) return;
    if (!credUsername.trim() && !credPassword) {
      toast({ title: 'Enter a username and/or password', variant: 'destructive' });
      return;
    }
    if (credPassword && credPassword.length < 4) {
      toast({ title: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    setSavingCreds(true);
    try {
      const result = await updatePatientPortalCredentials(credPatient.id, {
        username: credUsername.trim() || undefined,
        password: credPassword || undefined,
      });
      toast({
        title: 'Login updated',
        description: `Username for ${credPatient.name}: ${result.loginUsername}`,
      });
      setCredPatient(null);
      setCredPassword('');
      await load();
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to update login', variant: 'destructive' });
    } finally {
      setSavingCreds(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, patientName: string) => {
    setDeletingId(sessionId);
    try {
      await deleteSession(sessionId);
      toast({
        title: 'Session deleted',
        description: `Removed session for ${patientName}.`,
      });
      await load();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Admin console
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              All registered patients and their dialysis sessions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/architecture">
                <BookOpen className="h-4 w-4 mr-2" />
                Schema &amp; architecture
              </Link>
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add new patient</DialogTitle>
                  <DialogDescription>
                    Register a patient with portal login credentials for the Patient sign-in page.
                    If username/password are left blank, a username is auto-generated and the
                    default password is used.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="pname">Full name *</Label>
                    <Input
                      id="pname"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Anita Sharma"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="page">Age</Label>
                      <Input
                        id="page"
                        type="number"
                        min={0}
                        value={newAge}
                        onChange={(e) => setNewAge(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select value={newGender} onValueChange={setNewGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pemail">Email</Label>
                    <Input
                      id="pemail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Optional — patient contact email"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ploginUser">Login username</Label>
                    <Input
                      id="ploginUser"
                      value={newLoginUsername}
                      onChange={(e) => setNewLoginUsername(e.target.value)}
                      placeholder="Optional — auto if blank"
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ploginPass">Login password</Label>
                    <Input
                      id="ploginPass"
                      type="password"
                      value={newLoginPassword}
                      onChange={(e) => setNewLoginPassword(e.target.value)}
                      placeholder="Optional — default patient123"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPatient} disabled={addingPatient}>
                    {addingPatient ? 'Saving...' : 'Create patient'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <MedicalReportDownload
          patientId={reportPatientId}
          patients={overview.map((p) => ({
            id: p.id,
            name: p.name,
            age: p.age,
            gender: p.gender,
            medicalRecordNumber: p.medicalRecordNumber,
          }))}
          allowPatientSelect
          title="Patient medical report"
          description="Download PDF summaries for any patient (last 5, 7, 15, or 30 days)."
        />

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{overview.length}</p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {overview.reduce((n, p) => n + p.sessionCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">
                  {overview.reduce((n, p) => n + p.alertCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Clinical alerts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {overview.reduce((n, p) => n + p.noteCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Notes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading && overview.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Loading patients...</p>
        ) : overview.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground space-y-4">
              <p>No patients registered yet.</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add your first patient
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {overview.map((p) => (
              <AccordionItem key={p.id} value={p.id} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex flex-1 flex-wrap items-center gap-3 text-left">
                    <div>
                      <p className="font-semibold text-base">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.medicalRecordNumber} · {p.gender} · Age {p.age ?? '—'}
                        {p.email ? ` · ${p.email}` : ''}
                        {p.loginUsername ? ` · login: ${p.loginUsername}` : ''}
                        {p.mustChangePassword ? ' · must change password' : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-auto mr-4">
                      <Badge variant="secondary">{p.sessionCount} sessions</Badge>
                      <Badge variant="outline">{p.noteCount} notes</Badge>
                      <Badge variant="outline">{p.attachmentCount} files</Badge>
                      {p.alertCount > 0 && (
                        <Badge variant="destructive">{p.alertCount} alerts</Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground flex-1">
                      <p>
                        <span className="font-medium text-foreground">Patient ID:</span>{' '}
                        <code className="text-xs">{p.id}</code>
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Registered:</span>{' '}
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openCredDialog(p)}>
                      <KeyRound className="h-3 w-3 mr-1" />
                      Login
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/health-history/${p.id}`}>
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Health history
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingPatientId === p.id}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete patient
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {p.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the patient record
                            {p.sessionCount > 0
                              ? ` and all ${p.sessionCount} dialysis session(s), notes, attachments, and alerts`
                              : ''}
                            . This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeletePatient(p)}
                          >
                            Delete patient
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {p.sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sessions for this patient.</p>
                  ) : (
                    <div className="space-y-2">
                      {p.sessions.map((s) => (
                        <div
                          key={s.id}
                          className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-muted/30"
                        >
                          <Calendar className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-[200px]">
                            <p className="font-medium text-sm">{s.sessionDate}</p>
                            <p className="text-xs text-muted-foreground">{s.hospitalName}</p>
                          </div>
                          <Badge
                            className={
                              s.status === 'completed'
                                ? 'bg-success/10 text-success'
                                : 'bg-primary/10 text-primary'
                            }
                          >
                            {s.status}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/session/${s.id}`}>
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingId === s.id}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete session?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the session for {p.name} on{' '}
                                  {s.sessionDate}, including notes and attachments. This cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteSession(s.id, p.name)}
                                >
                                  Delete session
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>

      <Dialog
        open={!!credPatient}
        onOpenChange={(open) => {
          if (!open) {
            setCredPatient(null);
            setCredPassword('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Patient login — {credPatient?.name}</DialogTitle>
            <DialogDescription>
              Set or reset this patient&apos;s portal username and password. Leave password blank to
              keep the current one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="cred-username">Username</Label>
              <Input
                id="cred-username"
                value={credUsername}
                onChange={(e) => setCredUsername(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cred-password">New password</Label>
              <Input
                id="cred-password"
                type="password"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCredPatient(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCredentials} disabled={savingCreds}>
              {savingCreds ? 'Saving…' : 'Save login'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
