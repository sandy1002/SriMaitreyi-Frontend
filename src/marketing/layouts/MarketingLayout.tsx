import { Outlet } from 'react-router-dom';
import { MarketingWebsite } from '@/marketing/layouts/MarketingWebsite';
import { MarketingHeader } from '@/marketing/layouts/MarketingHeader';
import { MarketingFooter } from '@/marketing/layouts/MarketingFooter';
import '@/marketing/marketing.css';

export function MarketingLayout() {
  return (
    <MarketingWebsite>
      <MarketingHeader />
      <Outlet />
      <MarketingFooter />
    </MarketingWebsite>
  );
}
