import { cn } from '@/lib/utils';

/** Square product/company marks (legacy sizing). */
const SQUARE_SIZES = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
} as const;

/** Horizontal SriMae wordmark from brand kit. */
const WORDMARK_SIZES = {
  sm: 'h-8 w-auto max-w-[140px]',
  md: 'h-10 w-auto max-w-[180px]',
  lg: 'h-14 w-auto max-w-[260px]',
} as const;

type AppLogoProps = {
  size?: keyof typeof SQUARE_SIZES;
  className?: string;
  alt?: string;
  /** company = main SriMae wordmark; dialysis = kidney product icon */
  variant?: 'company' | 'dialysis';
};

const LOGO_SRC = {
  company: '/logo-srimae-main.png',
  dialysis: '/logo-dialysis.png',
} as const;

export function AppLogo({
  size = 'md',
  className,
  alt,
  variant = 'company',
}: AppLogoProps) {
  const isWordmark = variant === 'company';
  return (
    <img
      src={LOGO_SRC[variant]}
      alt={alt ?? (variant === 'dialysis' ? 'Srimae Dialysis App' : 'SriMae')}
      className={cn(
        'object-contain',
        isWordmark ? WORDMARK_SIZES[size] : SQUARE_SIZES[size],
        className
      )}
    />
  );
}
