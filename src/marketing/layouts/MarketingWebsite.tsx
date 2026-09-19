import { cn } from '@/lib/utils';

interface MarketingWebsiteProps {
  children: React.ReactNode;
  className?: string;
}

export function MarketingWebsite({ children, className }: MarketingWebsiteProps) {
  return (
    <div className={cn('marketing-site min-h-screen flex flex-col bg-background', className)}>
      {children}
    </div>
  );
}
