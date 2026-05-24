import { ClinicalAlert, ClinicalCheck } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface AlertsPanelProps {
  alerts: ClinicalAlert[];
  checks?: ClinicalCheck[];
  title?: string;
}

function severityIcon(severity: string) {
  if (severity === 'high') return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (severity === 'medium') return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  return <Info className="h-4 w-4 text-primary" />;
}

export function AlertsPanel({ alerts, checks = [], title = 'Clinical alerts & checks' }: AlertsPanelProps) {
  if (!alerts.length && !checks.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        {title}
      </h3>

      {alerts.map((a) => (
        <Alert
          key={a.id}
          variant={a.severity === 'high' ? 'destructive' : 'default'}
          className={
            a.severity === 'medium'
              ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20'
              : undefined
          }
        >
          {severityIcon(a.severity)}
          <AlertTitle className="text-sm capitalize">{a.severity} — {a.code}</AlertTitle>
          <AlertDescription>{a.message}</AlertDescription>
        </Alert>
      ))}

      {checks.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Recommended checks
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {checks.map((c, i) => (
              <li key={i}>
                <span className="font-medium text-foreground">{c.item}</span>
                {c.reason && <span className="block text-xs">Reason: {c.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
