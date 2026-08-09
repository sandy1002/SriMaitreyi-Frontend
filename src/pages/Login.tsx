import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getHomePath } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  User,
  ShieldCheck,
  ArrowLeft,
  Wrench,
  Stethoscope,
  Utensils,
  FileScan,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StaffRole } from '@/types';
import { AppLogo } from '@/components/layout/AppLogo';

type Persona = 'patient' | 'admin' | StaffRole | null;

const STAFF_PERSONAS: { id: StaffRole; label: string; description: string; icon: typeof Wrench }[] = [
  {
    id: 'technician',
    label: 'Technician',
    description: 'Sessions, vitals, and patient reports',
    icon: Wrench,
  },
  {
    id: 'doctor',
    label: 'Doctor',
    description: 'Clinical review, trends, and reports',
    icon: Stethoscope,
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    description: 'Diet diaries, alerts, and patient reports',
    icon: Utensils,
  },
];

export default function Login() {
  const [persona, setPersona] = useState<Persona>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { loginAsPatient, loginAsAdmin, loginAsStaff } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isStaffPersona =
    persona === 'technician' || persona === 'doctor' || persona === 'nutrition';

  const handlePatientLogin = async () => {
    if (!username.trim() || !password) {
      toast({ title: 'Enter username and password', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { mustChangePassword } = await loginAsPatient(username.trim(), password);
      navigate(mustChangePassword ? '/change-password' : '/dashboard');
    } catch (err) {
      console.error('Patient login failed', err);
      toast({
        title: 'Login failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStaffLogin = async () => {
    if (!isStaffPersona) return;
    if (!username.trim() || !password) {
      toast({ title: 'Enter username and password', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await loginAsStaff(persona, username.trim(), password);
      navigate(getHomePath(persona));
    } catch (err) {
      console.error('Staff login failed', err);
      toast({
        title: 'Login failed',
        description: 'Invalid credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!username.trim() || !password) {
      toast({ title: 'Enter username and password', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await loginAsAdmin(username.trim(), password);
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

  const resetCredentials = () => {
    setUsername('');
    setPassword('');
  };

  const loginPlaceholder =
    persona === 'patient'
      ? 'your username'
      : persona === 'technician'
        ? 'techadmin'
        : persona === 'doctor'
          ? 'docadmin'
          : persona === 'nutrition'
            ? 'nutritionadmin'
            : 'Admin';

  const staffMeta = STAFF_PERSONAS.find((p) => p.id === persona);

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="flex justify-end px-4 pt-4">
        <Button asChild variant="outline" size="sm" className="gap-2 shadow-sm bg-background/80">
          <Link to="/padoc/login">
            <FileScan className="h-4 w-4" />
            PaDoc login
          </Link>
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        <div className="text-center">
          <AppLogo size="lg" className="mx-auto" />
          <h1 className="mt-4 text-3xl font-bold text-foreground">SriMai</h1>
          <p className="mt-3 text-muted-foreground">Dialysis App</p>
        </div>

        {persona === null && (
          <Card className="shadow-clinical-lg">
            <CardHeader className="text-center">
              <CardTitle>Select your role</CardTitle>
              <CardDescription>
                Patients, clinical staff, and administrators each have a dedicated workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
                onClick={() => setPersona('patient')}
              >
                <User className="h-7 w-7 text-primary" />
                <span className="font-semibold">Patient</span>
                <span className="text-xs text-muted-foreground font-normal text-center">
                  Your sessions, diaries, and reports
                </span>
              </Button>
              {STAFF_PERSONAS.map((sp) => {
                const Icon = sp.icon;
                return (
                  <Button
                    key={sp.id}
                    type="button"
                    variant="outline"
                    className="h-auto py-6 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => setPersona(sp.id)}
                  >
                    <Icon className="h-7 w-7 text-primary" />
                    <span className="font-semibold">{sp.label}</span>
                    <span className="text-xs text-muted-foreground font-normal text-center">
                      {sp.description}
                    </span>
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="h-auto py-6 flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5 sm:col-span-2"
                onClick={() => setPersona('admin')}
              >
                <ShieldCheck className="h-7 w-7 text-primary" />
                <span className="font-semibold">Admin</span>
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
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 mb-2"
                onClick={() => {
                  setPersona(null);
                  resetCredentials();
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Patient sign-in
              </CardTitle>
              <CardDescription>
                Sign in with the username and password set for your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientUser">Username</Label>
                <Input
                  id="patientUser"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. anita_sharma_abc123"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientPass">Password</Label>
                <Input
                  id="patientPass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button
                onClick={handlePatientLogin}
                disabled={isSubmitting || !username.trim() || !password}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Signing in...' : 'Open my dashboard'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isStaffPersona && staffMeta && (
          <Card className="shadow-clinical-lg">
            <CardHeader>
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 mb-2"
                onClick={() => {
                  setPersona(null);
                  resetCredentials();
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <CardTitle className="flex items-center gap-2">
                <staffMeta.icon className="h-5 w-5 text-primary" />
                {staffMeta.label} sign-in
              </CardTitle>
              <CardDescription>{staffMeta.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staffUser">Username</Label>
                <Input
                  id="staffUser"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={loginPlaceholder}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staffPass">Password</Label>
                <Input
                  id="staffPass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button
                onClick={handleStaffLogin}
                disabled={isSubmitting || !username.trim() || !password}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Signing in...' : `Enter ${staffMeta.label} workspace`}
              </Button>
            </CardContent>
          </Card>
        )}

        {persona === 'admin' && (
          <Card className="shadow-clinical-lg">
            <CardHeader>
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 mb-2"
                onClick={() => {
                  setPersona(null);
                  resetCredentials();
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Admin sign-in
              </CardTitle>
              <CardDescription>Full admin console for all patients and sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminUser">Username</Label>
                <Input
                  id="adminUser"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Admin"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPass">Password</Label>
                <Input
                  id="adminPass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <Button
                onClick={handleAdminLogin}
                disabled={isSubmitting || !username.trim() || !password}
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
    </div>
  );
}
