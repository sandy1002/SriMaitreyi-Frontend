import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { changePasswordApi } from '@/services/api';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ChangePassword() {
  const { isAuthenticated, isPatient, isLoading, user, applyPasswordChange } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  if (!isAuthenticated || !isPatient) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.mustChangePassword) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      toast({ title: 'Password must be at least 4 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const result = await changePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
      });
      applyPasswordChange(result);
      toast({ title: 'Password updated', description: 'You can continue to your dashboard.' });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Could not update password',
        description: err instanceof Error ? err.message.replace(/^API \d+ [^:]+:\s*/, '') : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-md py-10">
        <Card>
          <CardHeader>
            <CardTitle>Change your password</CardTitle>
            <CardDescription>
              You are using a temporary clinic password. Choose a new password before continuing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Saving…' : 'Save new password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
