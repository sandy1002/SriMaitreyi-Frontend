import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { Header } from '@/components/layout/Header';
import { PatientInfoCard } from '@/components/cards/PatientInfoCard';
import { SessionCard } from '@/components/cards/SessionCard';
import { AIAssistant } from '@/components/chat/AIAssistant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { patient, user, isAuthenticated } = useAuth();
  const { sessions, loadSessionsByPatient } = useSession();
  const navigate = useNavigate();
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    if (patient?.id) {
      loadSessionsByPatient(patient.id);
    }
  }, [patient?.id]);

  if (!isAuthenticated || !patient) {
    return <Navigate to="/login" replace />;
  }

  const isPatient = user?.role === 'patient';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        {/* Patient Info */}
        <PatientInfoCard patient={patient} />

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          {isPatient && (
            <Card
              className="cursor-pointer shadow-clinical transition-all duration-200 hover:shadow-clinical-lg hover:-translate-y-0.5 gradient-card border-primary/20"
              onClick={() => navigate('/session/new')}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow">
                  <Plus className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Start New Session</h3>
                  <p className="text-sm text-muted-foreground">
                    Begin recording your dialysis session
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className="cursor-pointer shadow-clinical transition-all duration-200 hover:shadow-clinical-lg hover:-translate-y-0.5"
            onClick={() => setShowAssistant(true)}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <MessageSquare className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ask AI Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  Get insights about your sessions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-clinical">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-clinical">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {sessions.filter(s => s.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-clinical">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {sessions.filter(s => s.status === 'in-progress').length}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card className="shadow-clinical">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Dialysis Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length > 0 ? (
              sessions.slice(0, 5).map((session, index) => (
                <div key={session.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <SessionCard session={session} />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No sessions recorded yet</p>
                {isPatient && (
                  <Button
                    variant="soft"
                    className="mt-4"
                    onClick={() => navigate('/session/new')}
                  >
                    Start Your First Session
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AIAssistant
        open={showAssistant}
        onOpenChange={setShowAssistant}
        patientId={patient.id}
      />
    </div>
  );
}
