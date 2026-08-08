import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileScan, ArrowLeft } from 'lucide-react';
import { usePadocAuth } from '@/context/PadocAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function PadocLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <FileScan className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold tracking-wide">PaDoc</span>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
          <Link to="/login">
            <ArrowLeft className="h-4 w-4 mr-1" />
            SriMai dialysis login
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-50 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">PaDoc doctor login</CardTitle>
            <CardDescription className="text-slate-400">
              Separate from SriMai dialysis. Store structured or unstructured documents for your
              practice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="padoc-username">Username</Label>
                <Input
                  id="padoc-username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-950 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="padoc-password">Password</Label>
                <Input
                  id="padoc-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-700"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in to PaDoc'}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                Default local credentials: <code>padoc</code> / <code>padoc</code>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
