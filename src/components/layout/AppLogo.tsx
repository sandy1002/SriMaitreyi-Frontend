import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
} as const;

type AppLogoProps = {
  size?: keyof typeof SIZES;
  className?: string;
  alt?: string;
};

export function AppLogo({ size = 'md', className, alt = 'Srimae dialysis care' }: AppLogoProps) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      className={cn('object-contain', SIZES[size], className)}
    />
  );
}
