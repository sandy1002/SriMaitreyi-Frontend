import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CircleHelp } from 'lucide-react';
import { formatVolumeFromMl } from '@/lib/clinicalUnits';
import type { InterdialyticFluidsSummary } from '@/types';

type InterdialyticPotassiumSummary = {
  fromDate: string | null;
  untilDate: string;
  lastSessionCompletedAt?: string | null;
  totalPotassiumMg: number;
  mealsInWindow?: {
    diaryDate: string;
    mealType: string;
    foodName?: string;
    mealTakenAt?: string;
    potassiumMg: number;
  }[];
};

type InterdialyticSessionSummaryProps = {
  fluids: InterdialyticFluidsSummary | null;
  potassium: InterdialyticPotassiumSummary | null;
  sessionDate: string;
  compact?: boolean;
  loading?: boolean;
  error?: string | null;
};

export function InterdialyticSessionSummary({
  fluids,
  potassium,
  sessionDate,
  compact = false,
  loading = false,
  error = null,
}: InterdialyticSessionSummaryProps) {
  if (loading) {
    return (
      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        <Card className="border-sky-500/30 bg-sky-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Interdialytic fluid intake</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Interdialytic potassium intake</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="py-4 text-sm text-destructive">
          Could not load interdialytic summary: {error}
        </CardContent>
      </Card>
    );
  }

  if (!fluids && !potassium) return null;

  const hasFluidData = (fluids?.dailyEntries.length ?? 0) > 0 || (fluids?.totalMl ?? 0) > 0;
  const hasPotassiumData =
    (potassium?.mealsInWindow?.length ?? 0) > 0 || (potassium?.totalPotassiumMg ?? 0) > 0;

  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
      {fluids && (
        <Card className="border-sky-500/30 bg-sky-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Interdialytic fluid intake
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="About interdialytic fluid intake"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-[300px] text-xs leading-relaxed">
                  <p>
                    Totals from the renal fluid diary between last session complete (
                    {fluids.lastSessionDate ?? '—'}) and this session start ({sessionDate}).
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {!hasFluidData ? (
              <p className="text-muted-foreground">No fluid diary entries in this period.</p>
            ) : (
              <>
                <p className="font-medium">
                  Total: {fluids.totalLiters} L ({fluids.totalMl} ml) · oral {fluids.totalOralMl} ml · IV{' '}
                  {fluids.totalIvMl} ml
                </p>
                {!compact &&
                  fluids.dailyEntries.map((day) => (
                    <div key={day.diaryDate} className="border rounded-md p-2 space-y-1">
                      <p className="font-medium">{day.diaryDate}</p>
                      {day.intakes.map((line) => (
                        <div key={line.id} className="flex justify-between gap-2 text-muted-foreground">
                          <span className="capitalize">
                            {line.category.replace('_', ' ')}
                            {line.description ? ` — ${line.description}` : ''}
                          </span>
                          <span className="text-foreground font-medium shrink-0">
                            {formatVolumeFromMl(line.volumeMl, line.volumeUnit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {potassium && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Interdialytic potassium intake
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="About interdialytic potassium intake"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="start" className="max-w-[300px] text-xs leading-relaxed">
                  <p>
                    Dietary potassium (mg) from nutrition diary between last session complete (
                    {potassium.lastSessionCompletedAt
                      ? new Date(potassium.lastSessionCompletedAt).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                        })
                      : potassium.fromDate ?? '—'}
                    ) and this session start ({sessionDate}).
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            {!hasPotassiumData ? (
              <p className="text-muted-foreground">No nutrition diary entries in this period.</p>
            ) : (
              <>
                <p className="font-medium">Total dietary K: {potassium.totalPotassiumMg} mg</p>
                {!compact &&
                  (potassium.mealsInWindow ?? []).map((m, i) => (
                    <div
                      key={i}
                      className="flex justify-between gap-2 text-muted-foreground border rounded-md p-2"
                    >
                      <span>
                        {m.diaryDate} · {m.mealType} — {m.foodName ?? 'meal'}
                        {m.mealTakenAt ? ` @ ${m.mealTakenAt}` : ''}
                      </span>
                      <span className="text-foreground font-medium shrink-0">{m.potassiumMg} mg</span>
                    </div>
                  ))}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
