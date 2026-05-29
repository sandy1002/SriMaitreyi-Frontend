import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { MedicalReportDownload } from '@/components/clinical/MedicalReportDownload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchPatientsOverview } from '@/services/api';
import type { PatientOverview, StaffRole, UserRole } from '@/types';
import {
  Stethoscope,
  Wrench,
  Utensils,
  Users,
  ExternalLink,
  RefreshCw,
  ClipboardList,
  TestTube2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ROLE_META: Record<
  StaffRole,
  { title: string; subtitle: string; icon: typeof Wrench; accent: string }
> = {
  technician: {
    title: 'Technician workspace',
    subtitle: 'Dialysis sessions, vitals workflow, and patient reports.',
    icon: Wrench,
    accent: 'text-amber-700 dark:text-amber-400',
  },
  doctor: {
    title: 'Doctor workspace',
    subtitle: 'Review sessions, trends, alerts, and download clinical summaries.',
    icon: Stethoscope,
    accent: 'text-blue-700 dark:text-blue-400',
  },
  nutrition: {
    title: 'Nutrition workspace',
    subtitle: 'Nutrition diaries, dietary alerts, and patient report summaries.',
    icon: Utensils,
    accent: 'text-emerald-700 dark:text-emerald-400',
  },
};

function isStaffRole(role: UserRole | undefined): role is StaffRole {
  return role === 'technician' || role === 'doctor' || role === 'nutrition';
}

export default function StaffDashboard() {
  const { user, isStaff, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [overview, setOverview] = useState<PatientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPatientId, setReportPatientId] = useState('');

  const role = user?.role;
  const meta = isStaffRole(role) ? ROLE_META[role] : ROLE_META.technician;
  const Icon = meta.icon;

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchPatientsOverview();
      setOverview(data.patients);
      if (!reportPatientId && data.patients[0]) {
        setReportPatientId(data.patients[0].id);
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to load patients', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isStaff) load();
  }, [isStaff]);

  if (!isAuthenticated || !isStaff || !isStaffRole(role)) {
    navigate('/login');
    return null;
  }

  const patientsForSelect = overview.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    medicalRecordNumber: p.medicalRecordNumber,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Icon className={`h-7 w-7 ${meta.accent}`} />
              <h1 className="text-2xl font-bold">{meta.title}</h1>
            </div>
            <p className="text-muted-foreground mt-1">{meta.subtitle}</p>
            <Badge variant="secondary" className="mt-2 capitalize">
              {role} persona
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <MedicalReportDownload
          patientId={reportPatientId}
          patients={patientsForSelect}
          allowPatientSelect
          title="Download medical report"
          description="PDF includes vitals, dialysis sessions, nutrition, fluid and medication diaries, alerts, summary, and care guidance."
        />

        {role === 'nutrition' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nutrition tools</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Open a patient session from the list below, then use nutrition diary APIs from the
              patient app routes when diary UI for staff is extended. Reports above include full
              nutrition totals and alerts for the selected period.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patients ({overview.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-muted-foreground">Loading…</p>}
            {!loading && overview.length === 0 && (
              <p className="text-muted-foreground">No patients registered.</p>
            )}
            {overview.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.medicalRecordNumber} · {p.sessionCount} sessions · {p.alertCount} alerts
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReportPatientId(p.id)}
                  >
                    Select for report
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/health-history/${p.id}`}>
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Health history
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/cbp/${p.id}`}>
                      <TestTube2 className="h-4 w-4 mr-1" />
                      CBP
                    </Link>
                  </Button>
                  {p.sessions[0] && (
                    <Button size="sm" asChild>
                      <Link to={`/session/${p.sessions[0].id}`}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Latest session
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {isAuthenticated && user?.role === 'admin' && (
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            Back to admin console
          </Button>
        )}
      </main>
    </div>
  );
}
