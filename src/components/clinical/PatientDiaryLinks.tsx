import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Droplets, Utensils, Pill, Syringe } from 'lucide-react';

interface Props {
  patientId: string;
  compact?: boolean;
}

/** Quick links for staff to open a patient's diaries. */
export function PatientDiaryLinks({ patientId, compact }: Props) {
  const btn = compact ? 'sm' : 'sm';
  return (
    <div className="flex flex-wrap gap-2">
      <Button size={btn} variant="outline" asChild>
        <Link to={`/fluid-diary/${patientId}`}>
          <Droplets className="h-4 w-4 mr-1" />
          Fluid diary
        </Link>
      </Button>
      <Button size={btn} variant="outline" asChild>
        <Link to={`/nutrition-diary/${patientId}`}>
          <Utensils className="h-4 w-4 mr-1" />
          Nutrition diary
        </Link>
      </Button>
      <Button size={btn} variant="outline" asChild>
        <Link to={`/medication-diary/${patientId}`}>
          <Pill className="h-4 w-4 mr-1" />
          Medication diary
        </Link>
      </Button>
      <Button size={btn} variant="outline" asChild>
        <Link to={`/vaccine-diary/${patientId}`}>
          <Syringe className="h-4 w-4 mr-1" />
          Vaccine diary
        </Link>
      </Button>
    </div>
  );
}
