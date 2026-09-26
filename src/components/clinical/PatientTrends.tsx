import { useEffect, useState } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { fetchPatientTrends } from '@/services/api';
import type { PatientTrendsResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TrendingUp, AlertTriangle, Network, ChevronDown } from 'lucide-react';
import { formatISTChartTick } from '@/lib/datetime';
import { AlertsPanel } from '@/components/clinical/AlertsPanel';
import { cn } from '@/lib/utils';

const weightChartConfig = {
  pre: { label: 'Pre (kg)', color: 'hsl(var(--primary))' },
  post: { label: 'Post (kg)', color: 'hsl(var(--chart-2))' },
};

interface PatientTrendsProps {
  patientId: string;
  compact?: boolean;
}

export function PatientTrends({ patientId, compact }: PatientTrendsProps) {
  const [trends, setTrends] = useState<PatientTrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPatientTrends(patientId)
      .then((data) => {
        if (!cancelled) setTrends(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load trends');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (loading) {
    return (
      <Card className="shadow-clinical">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading clinical trends…
        </CardContent>
      </Card>
    );
  }

  if (error || !trends) {
    return (
      <Card className="shadow-clinical border-destructive/30">
        <CardContent className="py-6 text-sm text-muted-foreground">
          {error ?? 'Trends unavailable'}
        </CardContent>
      </Card>
    );
  }

  const chartData = trends.weightTrend
    .filter((w) => w.preWeightKg != null || w.postWeightKg != null)
    .map((w) => ({
      label: formatISTChartTick(w.sessionDate),
      pre: w.preWeightKg ?? undefined,
      post: w.postWeightKg ?? undefined,
    }));

  const pg = trends.propertyGraph;
  const neo4jOn = pg?.neo4jAvailable === true;
  const alertCount = trends.recentAlerts.length;

  return (
    <div className="space-y-4">
      <Card className="shadow-clinical">
        <CardHeader className={compact ? 'pb-2' : undefined}>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Weight trend (Phase 2)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={weightChartConfig} className="h-[220px] w-full">
              <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit=" kg" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="pre" stroke="var(--color-pre)" strokeWidth={2} dot />
                <Line type="monotone" dataKey="post" stroke="var(--color-post)" strokeWidth={2} dot />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Complete sessions with pre/post weights to see trends.
            </p>
          )}
        </CardContent>
      </Card>

      {!compact && alertCount > 0 && (
        <Collapsible open={alertsOpen} onOpenChange={setAlertsOpen}>
          <Card className="shadow-clinical">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full h-auto justify-between px-6 py-4 rounded-xl hover:bg-muted/50"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Recent alerts across sessions
                  <Badge variant="secondary" className="ml-1">
                    {alertCount}
                  </Badge>
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    alertsOpen && 'rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                <AlertsPanel alerts={trends.recentAlerts} title="" />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <Card className="shadow-clinical">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Network className="h-4 w-4 text-primary" />
            Property graph insights
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          {neo4jOn && pg.recurringSymptoms && pg.recurringSymptoms.length > 0 ? (
            <div>
              <p className="font-medium text-foreground mb-2">Recurring symptoms</p>
              <ul className="space-y-1 text-muted-foreground">
                {pg.recurringSymptoms.map((s) => (
                  <li key={s.symptom} className="flex justify-between gap-4">
                    <span>{s.symptom}</span>
                    <span>{s.sessionCount} session(s)</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-muted-foreground space-y-2">
              <p>
                Session chains and symptom patterns sync to Neo4j when notes are saved and Neo4j is
                reachable.
              </p>
              {pg.neo4jMessage && (
                <p className="text-xs font-mono bg-muted/50 rounded p-2 break-all">
                  {pg.neo4jMessage}
                </p>
              )}
            </div>
          )}
          {pg.dizzinessSessionCount != null && pg.dizzinessSessionCount > 0 && (
            <p className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Dizziness recorded in {pg.dizzinessSessionCount} session(s) in the graph.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
