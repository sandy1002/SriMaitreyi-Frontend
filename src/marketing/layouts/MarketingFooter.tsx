import { Link } from 'react-router-dom';
import { site } from '@/marketing/content';

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="ombre-cta-light mt-auto">
      <div className="container mx-auto px-4 max-w-6xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/logo-srimae-main.png"
                alt={site.name}
                className="block h-auto max-h-10 w-auto max-w-full object-contain"
              />
            </div>
            <p className="text-foreground/60 text-sm leading-relaxed max-w-xs">
              {site.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/50">
              Navigation
            </h3>
            <nav aria-label="Footer links" className="flex flex-col gap-2">
              {site.nav.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-foreground/50">
              Contact
            </h3>
            <p className="text-sm text-foreground/70 mb-1">hello@srimae.com</p>
            <p className="text-sm text-foreground/70">Atlanta, USA</p>
            <Link
              to="/contact"
              className="inline-block mt-4 text-sm font-semibold border border-primary ombre-text px-4 py-2 rounded-[var(--radius-button)] hover:bg-primary/5 transition-colors"
            >
              Request a Demo
            </Link>
          </div>
        </div>

        <div className="border-t border-foreground/15 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground/50">
            © {currentYear} {site.footer.copyright}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            {site.footer.links.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
