import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink } from 'lucide-react';
import type { DialysisSession } from '@/types';

function statusLabel(status: DialysisSession['status']) {
  if (status === 'completed') return 'Completed';
  if (status === 'post-dialysis') return 'Ended';
  return 'In progress';
}

function statusClass(status: DialysisSession['status']) {
  if (status === 'completed') return 'bg-success/10 text-success';
  if (status === 'post-dialysis') return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
  return 'bg-primary/10 text-primary';
}

interface Props {
  sessions: DialysisSession[];
  patientName?: string;
}

/** All dialysis sessions for a patient (staff / technician / doctor view). */
export function PatientSessionsList({ sessions, patientName }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No dialysis sessions recorded{patientName ? ` for ${patientName}` : ''}.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        Dialysis sessions ({sessions.length})
      </p>
      <div className="rounded-md border overflow-hidden">
        <div className="hidden sm:grid sm:grid-cols-[minmax(7rem,1fr)_minmax(8rem,1.2fr)_4.5rem_4.5rem_4.5rem_auto_auto] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
          <span>Date</span>
          <span>Hospital</span>
          <span>Pre wt</span>
          <span>Post wt</span>
          <span>UF out</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>
        <ul className="divide-y">
          {sessions.map((s) => {
            const pre = s.preDialysisAssessment;
            const post = s.postDialysisAssessment;
            return (
              <li
                key={s.id}
                className="flex flex-col gap-2 px-3 py-3 sm:grid sm:grid-cols-[minmax(7rem,1fr)_minmax(8rem,1.2fr)_4.5rem_4.5rem_4.5rem_auto_auto] sm:items-center sm:gap-2 sm:py-2.5 hover:bg-muted/30"
              >
                <span className="font-medium text-sm sm:font-normal">
                  <span className="sm:hidden text-muted-foreground text-xs">Date · </span>
                  {s.sessionDate?.slice(0, 10) ?? '—'}
                </span>
                <span className="text-sm text-muted-foreground truncate" title={s.hospitalName}>
                  <span className="sm:hidden text-xs font-medium text-foreground">Hospital · </span>
                  {s.hospitalName || '—'}
                </span>
                <span className="text-sm tabular-nums">
                  <span className="sm:hidden text-muted-foreground text-xs">Pre · </span>
                  {pre?.weightKg != null ? `${pre.weightKg} kg` : '—'}
                </span>
                <span className="text-sm tabular-nums">
                  <span className="sm:hidden text-muted-foreground text-xs">Post · </span>
                  {post?.postWeightKg != null ? `${post.postWeightKg} kg` : '—'}
                </span>
                <span className="text-sm tabular-nums">
                  <span className="sm:hidden text-muted-foreground text-xs">UF · </span>
                  {post?.totalUfRemoved != null ? `${post.totalUfRemoved} L` : '—'}
                </span>
                <Badge className={`w-fit capitalize ${statusClass(s.status)}`}>
                  {statusLabel(s.status)}
                </Badge>
                <div className="sm:text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/session/${s.id}`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      View
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
