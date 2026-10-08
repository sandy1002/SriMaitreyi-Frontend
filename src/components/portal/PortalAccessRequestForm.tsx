import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitPortalAccessRequest } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

type PortalType = 'doctor' | 'patient';

export function PortalAccessRequestForm({
  portalType,
  onSubmitted,
}: {
  portalType: PortalType;
  onSubmitted?: () => void;
}) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !username.trim() || !password) {
      toast({ title: 'Fill all required fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitPortalAccessRequest({
        portalType,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        username: username.trim(),
        password,
        organization: organization.trim() || undefined,
        specialty: specialty.trim() || undefined,
        message: message.trim() || undefined,
      });
      setDone(true);
      toast({ title: 'Request submitted', description: res.message });
      onSubmitted?.();
    } catch (err) {
      toast({
        title: 'Could not submit request',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-semibold text-foreground">Request sent</p>
        <p>
          A Srimae admin will review your {portalType} portal access request. You can sign in once
          it is approved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="space-y-1">
        <Label>Full name *</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Email *</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Phone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {portalType === 'doctor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Organization</Label>
            <Input value={organization} onChange={(e) => setOrganization(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Specialty</Label>
            <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Desired username *</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Password *</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={4}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Message to admin</Label>
        <Textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional — why you need access"
        />
      </div>
      <Button type="submit" className="ombre-btn border-0 font-semibold" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit for admin approval'}
      </Button>
      <p className="text-xs text-muted-foreground">
        Access is granted only after the main Srimae admin approves your request.
      </p>
    </form>
  );
}
