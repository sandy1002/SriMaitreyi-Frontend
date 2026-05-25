import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Activity, User, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Persona = 'patient' | 'admin' | null;

export default function Login() {
  const [persona, setPersona] = useState<Persona>(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const { loginAsPatient, loginAsAdmin, patients, patientsError } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePatientLogin = async () => {
    if (!selectedPatient) return;
    setIsSubmitting(true);
    try {
      await loginAsPatient(selectedPatient);
      navigate('/dashboard');
    } catch (err) {
      console.error('Patient login failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!adminUsername.trim() || !adminPassword) {
      toast({ title: 'Enter username and password', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await loginAsAdmin(adminUsername.trim(), adminPassword);
      navigate('/admin');
    } catch (err) {
      console.error('Admin login failed', err);
      toast({
        title: 'Login failed',
        description: 'Invalid admin username or password.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">SriMaiTreyi</h1>
          <p className="mt-2 text-muted-foreground">Dialysis Monitoring — choose how you sign in</p>
        </div>

        {persona === null && (
          <Card className="shadow-clinical-lg">
            <CardHeader className="text-center">
              <CardTitle>Select your role</CardTitle>
              <CardDescription>Patients access their own journal. Admins manage all patients.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-8 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5"
                onClick={() => setPersona('patient')}
              >
                <User className="h-8 w-8 text-primary" />
                <span className="font-semibold text-base">Patient</span>
                <span className="text-xs text-muted-foreground font-normal text-center">
                  View and record your dialysis sessions
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto py-8 flex-col gap-3 border-2 hover:border-primary hover:bg-primary/5"
                onClick={() => setPersona('admin')}
              >
                <ShieldCheck className="h-8 w-8 text-primary" />
                <span className="font-semibold text-base">Admin</span>
                <span className="text-xs text-muted-foreground font-normal text-center">
                  All patients, sessions, and management
                </span>
              </Button>
            </CardContent>
          </Card>
        )}

        {persona === 'patient' && (
          <Card className="shadow-clinical-lg">
            <CardHeader>
              <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => setPersona(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Patient sign-in
              </CardTitle>
              <CardDescription>Select your account to open your personal dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your account</Label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your name..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground text-xs ml-2">
                          ({p.medicalRecordNumber})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {patientsError && <p className="text-sm text-destructive">{patientsError}</p>}
                {!patientsError && patients.length === 0 && (
                  <p className="text-sm text-muted-foreground">No patient accounts in the system yet.</p>
                )}
              </div>
              <Button
                onClick={handlePatientLogin}
                disabled={!selectedPatient || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Signing in...' : 'Open my dashboard'}
              </Button>
            </CardContent>
          </Card>
        )}

        {persona === 'admin' && (
          <Card className="shadow-clinical-lg">
            <CardHeader>
              <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={() => setPersona(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Admin sign-in
              </CardTitle>
              <CardDescription>
                Access the admin console: all patients, session details, and delete sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminUser">Username</Label>
                <Input
                  id="adminUser"
                  type="text"
                  autoComplete="username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Admin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPass">Password</Label>
                <Input
                  id="adminPass"
                  type="password"
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <Button
                onClick={handleAdminLogin}
                disabled={isSubmitting || !adminUsername.trim() || !adminPassword}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Signing in...' : 'Enter admin console'}
              </Button>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
