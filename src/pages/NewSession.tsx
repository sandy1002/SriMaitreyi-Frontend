import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Building2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewSession() {
  const { patient, isAuthenticated, user } = useAuth();
  const { createSession } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [hospitalName, setHospitalName] = useState(
    'City General Hospital'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------
  // Guards
  // -------------------------------
  if (!isAuthenticated || !patient) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'patient') {
    return <Navigate to="/dashboard" replace />;
  }

  // -------------------------------
  // Submit handler
  // -------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const session = await createSession(
        patient.id,
        hospitalName,
        sessionDate
      );

      toast({
        title: 'Session Started',
        description:
          'Your dialysis session has been created successfully.',
      });

      navigate(`/session/${session.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          'Failed to create session. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 max-w-xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-clinical-lg animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-glow mb-4">
              <Play className="h-7 w-7 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">
              Start New Session
            </CardTitle>
            <CardDescription>
              Begin recording your dialysis session
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-primary" />
                  Session Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={sessionDate}
                  onChange={e =>
                    setSessionDate(e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="hospital"
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4 text-primary" />
                  Hospital / Dialysis Center
                </Label>
                <Input
                  id="hospital"
                  type="text"
                  value={hospitalName}
                  onChange={e =>
                    setHospitalName(e.target.value)
                  }
                  placeholder="Enter hospital name"
                  required
                />
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Creating...'
                    : 'Start Session'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
