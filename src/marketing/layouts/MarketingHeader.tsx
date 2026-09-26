import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { site } from '@/marketing/content';

export function MarketingHeader() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-16 items-center justify-between">
          <Link to="/services" className="flex items-center gap-2 font-bold text-lg text-foreground">
            <img
              src="/logo.png"
              alt={site.name}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <span className="hidden sm:inline">{site.name}</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {site.nav.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/contact"
              className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity"
            >
              Request Demo
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {site.nav.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`text-sm font-medium py-2 px-2 rounded-md transition-colors hover:bg-muted ${
                    location.pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/contact"
                className="mt-2 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-[var(--radius-button)] text-center hover:opacity-90 transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Request Demo
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
