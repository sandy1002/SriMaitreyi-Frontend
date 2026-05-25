import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Activity, User, Stethoscope } from 'lucide-react';

export default function Login() {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [role, setRole] = useState<'patient' | 'clinician'>('patient');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, patients, patientsError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!selectedPatient) return;
    setIsSubmitting(true);
    try {
      await login(selectedPatient, role);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-glow">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">SriMaiTreyi</h1>
          <p className="mt-2 text-muted-foreground">
            Your Personal Dialysis Journal
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-clinical-lg">
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Select your profile to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={role === 'patient' ? 'default' : 'outline'}
                className="h-auto py-4 flex-col gap-2"
                onClick={() => setRole('patient')}
              >
                <User className="h-5 w-5" />
                <span>Patient</span>
              </Button>
              <Button
                type="button"
                variant={role === 'clinician' ? 'default' : 'outline'}
                className="h-auto py-4 flex-col gap-2"
                onClick={() => setRole('clinician')}
              >
                <Stethoscope className="h-5 w-5" />
                <span>Clinician</span>
              </Button>
            </div>

            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Select Patient</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{patient.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({patient.medicalRecordNumber})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {patientsError && (
                <p className="text-sm text-destructive">{patientsError}</p>
              )}
              {!patientsError && patients.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No patients available yet. Add patients in backend data to continue.
                </p>
              )}
            </div>

            <Button
              onClick={handleLogin}
              disabled={!selectedPatient || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Continuing...' : 'Continue to Dashboard'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              This is a demonstration system for healthcare professionals and patients.
              <br />
              <Link to="/architecture" className="text-primary underline underline-offset-2">
                View system architecture & query guide
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
