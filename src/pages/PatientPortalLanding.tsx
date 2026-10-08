import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Activity,
  FileHeart,
  HeartPulse,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/layout/AppLogo';
import { PortalAccessRequestForm } from '@/components/portal/PortalAccessRequestForm';
import { healthPatientLogin } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const HEALTH_PATIENT_KEY = 'srimae_health_patient';

const FEATURES = [
  {
    icon: <Activity className="w-6 h-6" />,
    title: 'BP & home vitals',
    description: 'Log blood pressure, pulse, weight, and glucose for hypertension, diabetes, and general wellness.',
  },
  {
    icon: <FileHeart className="w-6 h-6" />,
    title: 'Medications & health records',
    description: 'Keep your medicine list and checkup notes for everyday conditions — not dialysis care.',
  },
  {
    icon: <HeartPulse className="w-6 h-6" />,
    title: 'Migraine & common conditions',
    description: 'Headache diary with intensity, triggers, and relief — plus tools for BP, asthma, thyroid, and more.',
  },
];

export default function PatientPortalLanding() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'request'>('request');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast({ title: 'Enter username and password', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await healthPatientLogin(username.trim(), password);
      try {
        sessionStorage.setItem(HEALTH_PATIENT_KEY, JSON.stringify(data.patient));
      } catch {
        /* ignore */
      }
      toast({
        title: `Welcome, ${data.patient.displayName}`,
        description: 'Patient Portal access granted.',
      });
      navigate('/patient-portal/home');
    } catch {
      toast({
        title: 'Login failed',
        description: 'Invalid credentials, or your access is still pending admin approval.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <Helmet>
        <title>Patient Portal — Srimae</title>
        <meta
          name="description"
          content="Srimae Patient Portal — self-monitor vitals and manage health checkup reports outside of dialysis care."
        />
      </Helmet>

      <div className="flex items-center justify-between px-4 py-3">
        <AppLogo size="sm" />
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to="/services">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to services
          </Link>
        </Button>
      </div>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-start animate-fade-in">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground border border-border px-3 py-1 rounded-full mb-5">
              <HeartPulse className="w-3.5 h-3.5 text-primary" />
              Patient Portal
            </span>
            <h1
              className="text-4xl md:text-5xl font-bold leading-tight mb-4"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <span className="ombre-text">Your health, on your terms</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Built for general patients — migraine diaries, medications, BP vitals, and regular
              health records for common conditions. Completely separate from the Dialysis Companion
              App. New accounts need Srimae admin approval.
            </p>
            <div className="grid gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="bg-card border border-border rounded-2xl p-5 flex gap-4 items-start"
                >
                  <div className="w-11 h-11 rounded-xl ombre-btn flex items-center justify-center text-white shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-sm mb-1">{f.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{
                background: 'linear-gradient(90deg, #6D28D9 0%, #c628d9 55%, #94d928 100%)',
              }}
            />
            <h2
              className="text-2xl font-bold text-foreground mb-1"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Patient Portal
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Request access for admin approval, or sign in once approved.
            </p>

            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                size="sm"
                variant={mode === 'request' ? 'default' : 'outline'}
                className={mode === 'request' ? 'ombre-btn border-0' : ''}
                onClick={() => setMode('request')}
              >
                Request access
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === 'login' ? 'default' : 'outline'}
                className={mode === 'login' ? 'ombre-btn border-0' : ''}
                onClick={() => setMode('login')}
              >
                Sign in
              </Button>
            </div>

            {mode === 'request' ? (
              <PortalAccessRequestForm portalType="patient" onSubmitted={() => setMode('login')} />
            ) : (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="space-y-1">
                  <Label>Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-12"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="ombre-btn border-0 font-semibold" disabled={submitting}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            )}

            <p className="mt-6 text-xs text-muted-foreground text-center">
              Looking for the Doctor Portal?{' '}
              <Link to="/doctor/login" className="font-semibold ombre-text hover:underline">
                Go there
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
