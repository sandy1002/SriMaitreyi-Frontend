import { Link } from 'react-router-dom';
import { site } from '@/marketing/content';

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 max-w-6xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <p className="font-bold text-lg mb-3">{site.name}</p>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
              {site.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/60">
              Navigation
            </h3>
            <nav aria-label="Footer links" className="flex flex-col gap-2">
              {site.nav.map((item) => (
                <Link
                  key={item.id}
                  to={item.href}
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-primary-foreground/60">
              Contact
            </h3>
            <p className="text-sm text-primary-foreground/70 mb-1">hello@srimae.com</p>
            <p className="text-sm text-primary-foreground/70">Atlanta, USA</p>
            <Link
              to="/contact"
              className="inline-block mt-4 text-sm font-semibold border border-primary-foreground/30 text-primary-foreground px-4 py-2 rounded-[var(--radius-button)] hover:bg-primary-foreground/10 transition-colors"
            >
              Request a Demo
            </Link>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {currentYear} {site.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
