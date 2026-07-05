import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { CircleHelp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InterdialyticFluidsSummary, InterdialyticPotassiumSummary } from '@/types';

type InterdialyticSessionSummaryProps = {
  fluids: InterdialyticFluidsSummary | null;
  potassium: InterdialyticPotassiumSummary | null;
  sessionDate: string;
  compact?: boolean;
  loading?: boolean;
  error?: string | null;
};

function PotassiumDaywiseBreakdown({
  potassium,
}: {
  potassium: InterdialyticPotassiumSummary;
}) {
  const mealsByDay = useMemo(() => {
    const map = new Map<string, NonNullable<InterdialyticPotassiumSummary['mealsInWindow']>>();
    for (const meal of potassium.mealsInWindow ?? []) {
      const list = map.get(meal.diaryDate) ?? [];
      list.push(meal);
      map.set(meal.diaryDate, list);
    }
    return map;
  }, [potassium.mealsInWindow]);

  const days =
    potassium.dailyEntries?.length > 0
      ? potassium.dailyEntries
      : Array.from(mealsByDay.entries()).map(([diaryDate, meals]) => ({
          diaryDate,
          totalPotassiumMg: meals.reduce((sum, m) => sum + m.potassiumMg, 0),
        }));

  if (days.length === 0) return null;

  return (
    <div className="space-y-2 pt-1">
      {days.map((day) => {
        const meals = mealsByDay.get(day.diaryDate) ?? [];
        return (
          <div key={day.diaryDate} className="border rounded-md p-2 space-y-1.5">
            <div className="flex justify-between gap-2 font-medium text-foreground">
              <span>{day.diaryDate}</span>
              <span className="shrink-0">{day.totalPotassiumMg} mg</span>
            </div>
            {meals.map((m, i) => (
              <div
                key={`${day.diaryDate}-${i}`}
                className="flex justify-between gap-2 text-muted-foreground text-xs pl-1"
              >
                <span>
                  {m.mealType} — {m.foodName ?? 'meal'}
                  {m.mealTakenAt ? ` @ ${m.mealTakenAt}` : ''}
                </span>
                <span className="text-foreground font-medium shrink-0">{m.potassiumMg} mg</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function InterdialyticSessionSummary({
  fluids,
  potassium,
  sessionDate,
  compact = false,
  loading = false,
  error = null,
}: InterdialyticSessionSummaryProps) {
  const [potassiumDetailsOpen, setPotassiumDetailsOpen] = useState(false);

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
  const hasPotassiumDaywise =
    (potassium?.dailyEntries?.length ?? 0) > 0 || (potassium?.mealsInWindow?.length ?? 0) > 0;

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
              <p className="font-medium">
                Total: {fluids.totalLiters} L ({fluids.totalMl} ml) · oral {fluids.totalOralMl} ml · IV{' '}
                {fluids.totalIvMl} ml
              </p>
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
                {hasPotassiumDaywise && (
                  <Collapsible open={potassiumDetailsOpen} onOpenChange={setPotassiumDetailsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-between h-9 font-normal"
                      >
                        <span>Daywise breakdown</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                            potassiumDetailsOpen && 'rotate-180'
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <PotassiumDaywiseBreakdown potassium={potassium} />
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
