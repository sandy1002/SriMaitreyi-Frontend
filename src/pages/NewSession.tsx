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

  const [weightKg, setWeightKg] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [pulse, setPulse] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [accessCondition, setAccessCondition] = useState<'Normal' | 'Abnormal'>('Normal');
  const [ufGoal, setUfGoal] = useState('');
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
      const { session, alerts } = await createSession(
        patient.id,
        hospitalName,
        sessionDate,
        {
          weightKg: Number(weightKg),
          bloodPressure,
          pulse: Number(pulse),
          temperature: Number(temperature),
          bloodSugar: Number(bloodSugar),
          accessCondition,
          ufGoal,
        }
      );

      toast({
        title: 'Session Started',
        description:
          alerts.length > 0
            ? `Session created. ${alerts.length} alert(s) flagged for review.`
            : 'Your dialysis session has been created successfully.',
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
              <CardTitle className="pt-4 text-lg">
                PRE-DIALYSIS ASSESSMENT
              </CardTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weightKg}
                    onChange={e => setWeightKg(e.target.value)}
                    placeholder="e.g. 70"
                    required
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodPressure">Blood Pressure</Label>
                  <Input
                    id="bloodPressure"
                    type="text"
                    value={bloodPressure}
                    onChange={e => setBloodPressure(e.target.value)}
                    placeholder="e.g. 120/80"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pulse">Pulse</Label>
                  <Input
                    id="pulse"
                    type="number"
                    value={pulse}
                    onChange={e => setPulse(e.target.value)}
                    placeholder="e.g. 72"
                    required
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    placeholder="e.g. 36.7"
                    required
                    step="0.1"
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodSugar">Blood Sugar</Label>
                  <Input
                    id="bloodSugar"
                    type="number"
                    value={bloodSugar}
                    onChange={e => setBloodSugar(e.target.value)}
                    placeholder="e.g. 110"
                    required
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ufGoal">UF Goal (Pre - Dry)</Label>
                  <Input
                    id="ufGoal"
                    type="text"
                    value={ufGoal}
                    onChange={e => setUfGoal(e.target.value)}
                    placeholder="e.g. 2.0 L"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="accessCondition">Access Condition</Label>
                  <select
                    id="accessCondition"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    value={accessCondition}
                    onChange={e =>
                      setAccessCondition(
                        e.target.value as 'Normal' | 'Abnormal'
                      )
                    }
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="Abnormal">Abnormal</option>
                  </select>
                </div>
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
