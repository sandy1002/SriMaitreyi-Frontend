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
  ArrowRight,
  Wrench,
  Stethoscope,
  Apple,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { StaffRole } from '@/types';
import { AppLogo } from '@/components/layout/AppLogo';

type Persona = 'patient' | 'admin' | StaffRole | null;

const ROLE_TILES: {
  id: Exclude<Persona, null>;
  label: string;
  description: string;
  icon: typeof User;
  gradient: string;
  lightBg: string;
  border: string;
}[] = [
  {
    id: 'patient',
    label: 'Patient',
    description: 'Your sessions, diaries, and reports',
    icon: User,
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'from-violet-50 to-purple-50',
    border: 'border-violet-200 hover:border-violet-400',
  },
  {
    id: 'technician',
    label: 'Technician',
    description: 'Sessions, vitals, and patient reports',
    icon: Wrench,
    gradient: 'from-purple-500 to-fuchsia-600',
    lightBg: 'from-purple-50 to-fuchsia-50',
    border: 'border-purple-200 hover:border-purple-400',
  },
  {
    id: 'doctor',
    label: 'Doctor',
    description: 'Clinical review, trends, and reports',
    icon: Stethoscope,
    gradient: 'from-fuchsia-500 to-pink-500',
    lightBg: 'from-fuchsia-50 to-pink-50',
    border: 'border-fuchsia-200 hover:border-fuchsia-400',
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    description: 'Diet diaries, alerts, and patient reports',
    icon: Apple,
    gradient: 'from-pink-500 to-lime-500',
    lightBg: 'from-pink-50 to-lime-50',
    border: 'border-pink-200 hover:border-lime-300',
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'All patients, sessions, and management',
    icon: ShieldCheck,
    gradient: 'from-lime-500 to-green-500',
    lightBg: 'from-lime-50 to-green-50',
    border: 'border-lime-200 hover:border-lime-400',
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

  const goBack = () => {
    setPersona(null);
    resetCredentials();
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

  const selectedTile = ROLE_TILES.find((t) => t.id === persona);
  const SelectedIcon = selectedTile?.icon;

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="px-4 pt-4">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to site
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        {persona === null ? (
          <div className="w-full max-w-4xl animate-fade-in">
            <div className="text-center mb-12 max-w-xl mx-auto">
              <AppLogo size="lg" className="mx-auto mb-6" />
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground border border-border px-3 py-1 rounded-full mb-5">
                Dialysis Companion App
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <span className="ombre-text">Select your role</span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Patients, clinical staff, and administrators each have a dedicated workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              {ROLE_TILES.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setPersona(role.id)}
                    className={`group relative flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-br ${role.lightBg} border-2 ${role.border} transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-left ${
                      role.id === 'admin' ? 'sm:col-span-2 lg:col-span-1' : ''
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h2
                        className="text-lg font-bold text-foreground mb-1"
                        style={{ fontFamily: 'DM Sans, sans-serif' }}
                      >
                        {role.label}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-foreground/60 group-hover:text-foreground transition-colors">
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: 'linear-gradient(90deg, #6D28D9 0%, #c628d9 55%, #94d928 100%)',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <p className="mt-10 text-sm text-muted-foreground text-center">
              Not a member yet?{' '}
              <Link to="/contact" className="font-semibold ombre-text hover:underline">
                Request access
              </Link>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6 animate-fade-in">
            <div className="text-center">
              <AppLogo size="md" className="mx-auto" />
              <p className="mt-3 text-sm text-muted-foreground">Dialysis App</p>
            </div>

            <Card className="shadow-clinical-lg border-border relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: 'linear-gradient(90deg, #6D28D9 0%, #c628d9 55%, #94d928 100%)',
                }}
              />
              <CardHeader>
                <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <CardTitle className="flex items-center gap-2">
                  {selectedTile && SelectedIcon && (
                    <div
                      className={`w-9 h-9 rounded-lg bg-gradient-to-br ${selectedTile.gradient} flex items-center justify-center text-white`}
                    >
                      <SelectedIcon className="h-4 w-4" />
                    </div>
                  )}
                  {selectedTile?.label} sign-in
                </CardTitle>
                <CardDescription>{selectedTile?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginUser">Username</Label>
                  <Input
                    id="loginUser"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={loginPlaceholder}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPass">Password</Label>
                  <Input
                    id="loginPass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (persona === 'patient') void handlePatientLogin();
                        else if (isStaffPersona) void handleStaffLogin();
                        else if (persona === 'admin') void handleAdminLogin();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => {
                    if (persona === 'patient') void handlePatientLogin();
                    else if (isStaffPersona) void handleStaffLogin();
                    else if (persona === 'admin') void handleAdminLogin();
                  }}
                  disabled={isSubmitting || !username.trim() || !password}
                  className="w-full ombre-btn border-0"
                  size="lg"
                >
                  {isSubmitting
                    ? 'Signing in...'
                    : persona === 'patient'
                      ? 'Open my dashboard'
                      : persona === 'admin'
                        ? 'Enter admin console'
                        : `Enter ${selectedTile?.label} workspace`}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
