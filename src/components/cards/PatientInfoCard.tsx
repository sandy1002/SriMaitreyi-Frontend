import { Patient } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { User, Calendar, Hash } from 'lucide-react';
import { formatIST, parseApiDateTime } from '@/lib/datetime';

interface PatientInfoCardProps {
  patient: Patient;
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
  const dialysisStartDate = parseApiDateTime(patient.dialysisSince);

  const yearsOnDialysis = dialysisStartDate
    ? Math.floor(
        (Date.now() - dialysisStartDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const dialysisSinceLabel = dialysisStartDate
    ? formatIST(dialysisStartDate, {
        timeZone: 'Asia/Kolkata',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Card className="shadow-clinical animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <User className="h-7 w-7 text-primary" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">
              {patient.name}
            </h2>

            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">
                  {patient.age}
                </span>{' '}
                years old
              </span>

              <span>{patient.gender}</span>

              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                {patient.medicalRecordNumber}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                On dialysis since{' '}
                <span className="font-medium text-foreground">
                  {dialysisSinceLabel ?? 'Not available'}
                </span>

                {dialysisStartDate && yearsOnDialysis && yearsOnDialysis > 0 && (
                  <span className="text-primary">
                    {' '}
                    ({yearsOnDialysis}+ years)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
