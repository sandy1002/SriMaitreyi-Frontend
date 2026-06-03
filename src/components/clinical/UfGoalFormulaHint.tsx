import { CircleHelp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Short explanation of the 3-step UF goal calculation shown on session start.
 */
export function UfGoalFormulaHint() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex rounded-full p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="How UF goal is calculated"
        >
          <CircleHelp className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-[280px] text-xs leading-relaxed">
        <p className="font-medium mb-1.5">UF goal formula</p>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>
            <span className="text-foreground">IDWG</span> (kg, ≈ L gained) = pre weight − dry
            weight
          </li>
          <li>
            <span className="text-foreground">Fluids in treatment</span> (L) = (prime + IV +
            oral) ÷ 1000
          </li>
          <li>
            <span className="text-foreground">UF goal</span> (L) = IDWG + fluids in treatment
          </li>
        </ol>
        <p className="mt-2 text-muted-foreground">
          Prime/rinseback defaults to 250 ml (typical line/dialyzer volume). Oral and IV fields are
          for fluids given during this run only — not fluid diary totals between sessions (those
          affect weight gain / IDWG via pre weight).
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
