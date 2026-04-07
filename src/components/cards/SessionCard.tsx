import { DialysisSession } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SessionCardProps {
  session: DialysisSession;
}

export function SessionCard({ session }: SessionCardProps) {
  const navigate = useNavigate();

  // Safe date handling
  const rawSessionDate =
    session.sessionDate ?? session.session_date ?? null;

  const sessionDate = rawSessionDate
    ? new Date(rawSessionDate)
    : null;

  const isValidDate =
    sessionDate && !isNaN(sessionDate.getTime());

  return (
    <Card
      className="cursor-pointer shadow-clinical transition-all duration-200 hover:shadow-clinical-lg hover:-translate-y-0.5 animate-slide-up"
      onClick={() => navigate(`/session/${session.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Calendar className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold text-foreground">
                  {isValidDate
                    ? sessionDate!.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Date not available'}
                </p>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {session.hospitalName ?? session.hospital_name}
                </div>
              </div>
            </div>

            {session.summary && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {session.summary}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Badge
              className={
                session.status === 'completed'
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-primary/10 text-primary border-primary/20'
              }
            >
              {session.status === 'completed'
                ? 'Completed'
                : 'In Progress'}
            </Badge>

            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
