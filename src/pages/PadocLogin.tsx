import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { usePadocAuth } from '@/context/PadocAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/layout/AppLogo';

const FEATURES = [
  'Doctor-only secure login',
  'Structured & unstructured documents',
  'Separate from dialysis patient data',
];

export default function PadocLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = usePadocAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast({ title: 'Enter username and password', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/padoc/dashboard');
    } catch {
      toast({
        title: 'PaDoc login failed',
        description: 'Invalid credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <AppLogo size="sm" />
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to site
          </Link>
        </Button>
      </div>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-fade-in">
          {/* Left: branding */}
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 self-start text-xs font-semibold uppercase tracking-widest text-muted-foreground border border-border px-3 py-1 rounded-full">
              PaDoc — Doctor Portal
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold leading-tight"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <span className="ombre-text">Doctor login</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A secure document vault for doctors — store, organize, and review structured or
              unstructured clinical documents separate from the dialysis patient app.
            </p>
            <ul className="flex flex-col gap-3 mt-2">
              {FEATURES.map((text) => (
                <li key={text} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
                  <span className="text-foreground font-medium">{text}</span>
                </li>
              ))}
            </ul>
            <div className="h-1 w-24 rounded-full ombre-btn mt-2" />
          </div>

          {/* Right: form card */}
          <div className="relative bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{
                background: 'linear-gradient(90deg, #6D28D9 0%, #c628d9 55%, #94d928 100%)',
              }}
            />
            <div className="w-14 h-14 rounded-2xl ombre-btn flex items-center justify-center mb-6 shadow-md">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h2
              className="text-2xl font-bold text-foreground mb-1"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              PaDoc
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Separate from Srimae dialysis. Store structured or unstructured documents for your
              practice.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="padoc-username" className="text-sm font-semibold">
                  Username
                </Label>
                <Input
                  id="padoc-username"
                  autoComplete="username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="padoc-password" className="text-sm font-semibold">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="padoc-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-12"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="ombre-btn w-full h-11 border-0 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in to PaDoc'}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              Need access?{' '}
              <Link to="/contact" className="font-semibold ombre-text hover:underline">
                Contact our team
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
