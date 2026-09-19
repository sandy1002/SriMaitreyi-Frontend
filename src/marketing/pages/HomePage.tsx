import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Brain, Activity, ShieldCheck, Users, BarChart2, Lock, ArrowRight, CheckCircle2, Quote, Stethoscope, Building2, FlaskConical } from 'lucide-react';
import { home } from '@/marketing/content';

const featureIcons: Record<string, React.ReactNode> = {
  brain: <Brain className="w-6 h-6" />,
  activity: <Activity className="w-6 h-6" />,
  'shield-check': <ShieldCheck className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  'bar-chart-2': <BarChart2 className="w-6 h-6" />,
  lock: <Lock className="w-6 h-6" />,
};

const serviceIcons: Record<string, React.ReactNode> = {
  sv1: <Stethoscope className="w-7 h-7" />,
  sv2: <Building2 className="w-7 h-7" />,
  sv3: <FlaskConical className="w-7 h-7" />,
};

export function HomePage() {
  const site = 'https://srimae.com';
  const title = 'Srimae — AI-Powered Clinical Intelligence for Doctors';
  const description = 'Srimae empowers healthcare professionals with smart data insights for faster, more precise diagnosis and prevention across all medical domains.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${site}/#website`, name: 'Srimae', url: `${site}/` },
      {
        '@type': 'Organization',
        '@id': `${site}/#organization`,
        name: 'Srimae',
        url: `${site}/`,
        description,
      },
      {
        '@type': 'WebPage',
        '@id': `${site}/#webpage`,
        url: `${site}/`,
        name: title,
        isPartOf: { '@id': `${site}/#website` },
        about: { '@id': `${site}/#organization` },
        datePublished: '2026-08-23',
        dateModified: '2026-08-23',
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${site}/`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site}/`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="/airo-assets/images/pages/home/hero"
              alt=""
              className="w-full h-full object-cover opacity-15"
              width={1440}
              height={800}
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/60" />
          </div>
          <div className="relative container mx-auto px-4 max-w-6xl py-24 md:py-32">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary-foreground/60 mb-4 border border-primary-foreground/20 px-3 py-1 rounded-full">
                {home.hero.eyebrow}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                {home.hero.heading}
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed mb-10 max-w-xl">
                {home.hero.subheading}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-primary-foreground text-primary font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity"
                >
                  {home.hero.primaryCta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center justify-center gap-2 border border-primary-foreground/30 text-primary-foreground font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:bg-primary-foreground/10 transition-colors"
                >
                  {home.hero.secondaryCta}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bg-card border-b border-border">
          <div className="container mx-auto px-4 max-w-6xl py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {home.stats.map((stat) => (
                <div key={stat.id} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {home.features.heading}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {home.features.subheading}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {home.features.items.map((feature) => (
                <div
                  key={feature.id}
                  className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                    {featureIcons[feature.icon] ?? <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Services ── */}
        <section className="bg-muted py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {home.services.heading}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {home.services.subheading}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {home.services.items.map((service) => (
                <div
                  key={service.id}
                  className="bg-background rounded-2xl border border-border p-8 flex flex-col hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                      {serviceIcons[service.id] ?? <CheckCircle2 className="w-7 h-7" />}
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {service.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {service.description}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {service.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {home.howItWorks.heading}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {home.howItWorks.subheading}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {home.howItWorks.steps.map((step, idx) => (
                <div key={step.id} className="relative">
                  {idx < home.howItWorks.steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border -translate-x-1/2 z-0" />
                  )}
                  <div className="relative z-10 bg-background rounded-xl p-8 border border-border text-center shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-5">
                      {step.step}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Trusted by Leading Clinicians
              </h2>
              <p className="text-muted-foreground text-lg">
                Hear from doctors who use Srimae every day.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {home.testimonials.map((t) => (
                <div key={t.id} className="bg-card border border-border rounded-xl p-6 flex flex-col">
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  <p className="text-foreground text-sm leading-relaxed flex-1 mb-6 italic">
                    {t.quote}
                  </p>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-primary text-primary-foreground py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {home.cta.heading}
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10">
              {home.cta.subheading}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold px-8 py-4 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-base"
            >
              {home.cta.buttonLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
