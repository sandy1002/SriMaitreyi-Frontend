import { DIALYSIS_APP_LOGIN_URL, isExternalLoginUrl } from '@/marketing/config';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, Stethoscope, Building2, FlaskConical,
  Droplets, Utensils, BarChart2, Weight, FlaskConical as Beaker, NotebookPen
} from 'lucide-react';
import { services } from '@/marketing/content';

const serviceIcons: Record<string, React.ReactNode> = {
  sv1: <Stethoscope className="w-7 h-7" />,
  sv2: <Building2 className="w-7 h-7" />,
  sv3: <FlaskConical className="w-7 h-7" />,
};

const dialysisIcons: Record<string, React.ReactNode> = {
  da1: <Droplets className="w-5 h-5" />,
  da2: <Beaker className="w-5 h-5" />,
  da3: <Droplets className="w-5 h-5" />,
  da4: <Weight className="w-5 h-5" />,
  da5: <Utensils className="w-5 h-5" />,
  da6: <NotebookPen className="w-5 h-5" />,
  da7: <BarChart2 className="w-5 h-5" />,
};

export function ServicesPage() {
  const site = 'https://srimae.com';
  const url = `${site}/services`;
  const title = 'Services & Products — Srimae';
  const description =
    'Explore Srimae\'s clinical decision support, population health analytics, research intelligence, and the Dialysis Companion App — AI-powered tools built for healthcare professionals.';

  const [activeTab, setActiveTab] = useState<string>('tab-dialysis');

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${url}#webpage`,
            name: title,
            url,
            isPartOf: { '@id': `${site}/#website` },
            about: { '@id': `${site}/#organization` },
          })}
        </script>
      </Helmet>

      <main>
        {/* ── Hero ── */}
        <section className="bg-primary text-primary-foreground py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary-foreground/60 mb-4 border border-primary-foreground/20 px-3 py-1 rounded-full">
              {services.hero.eyebrow}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {services.hero.heading}
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              {services.hero.subheading}
            </p>
          </div>
        </section>

        {/* ── Tabs ── */}
        <section className="border-b border-border bg-background sticky top-0 z-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div
              role="group"
              aria-label="Services navigation"
              className="flex gap-0"
            >
              {services.tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.id === 'tab-dialysis' && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {tab.label}
                    </span>
                  )}
                  {tab.id !== 'tab-dialysis' && tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Clinical Services Tab ── */}
        {activeTab === 'tab-services' && (
          <section className="py-20 md:py-24">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-14 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {services.clinicalServices.heading}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {services.clinicalServices.subheading}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {services.clinicalServices.items.map((service) => (
                  <div
                    key={service.id}
                    className="bg-card rounded-2xl border border-border p-8 flex flex-col hover:shadow-lg transition-shadow"
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
        )}

        {/* ── Dialysis App Tab ── */}
        {activeTab === 'tab-dialysis' && (
          <section className="py-20 md:py-24">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
                {/* Dialysis App card */}
                <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-border flex items-center justify-center mb-5 overflow-hidden">
                    <img
                      src="/logo.png"
                      alt="Dialysis Companion App"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full mb-4">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {services.dialysisApp.badge}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {services.dialysisApp.heading}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                    {services.dialysisApp.subheading}
                  </p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {isExternalLoginUrl(DIALYSIS_APP_LOGIN_URL) ? (
                      <a
                        href={DIALYSIS_APP_LOGIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-sm"
                      >
                        Login to Dialysis App
                      </a>
                    ) : (
                      <Link
                        to={DIALYSIS_APP_LOGIN_URL}
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-sm"
                      >
                        Login to Dialysis App
                      </Link>
                    )}
                    <Link
                      to="/contact"
                      className="inline-flex items-center justify-center gap-2 border border-border text-foreground font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:bg-muted transition-colors text-sm"
                    >
                      {services.dialysisApp.ctaLabel}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* PaDoc card */}
                <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 rounded-2xl bg-slate-900 text-emerald-400 shadow-md border border-slate-800 flex items-center justify-center mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-full mb-4">
                    {services.padocApp.badge}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                    {services.padocApp.heading}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                    {services.padocApp.subheading}
                  </p>
                  <ul className="text-left text-sm text-muted-foreground space-y-2 mb-8 w-full max-w-xs">
                    {services.padocApp.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={services.padocApp.ctaHref}
                    className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-sm w-full max-w-xs"
                  >
                    {services.padocApp.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Feature tiles */}
              <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-foreground">
                  Dialysis App features
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {services.dialysisApp.features.map((feat) => (
                  <div
                    key={feat.id}
                    className="bg-card border border-border rounded-xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      {dialysisIcons[feat.id] ?? <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm mb-1">
                        {feat.title}
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Bottom CTA ── */}
        <section className="bg-muted py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {services.cta.heading}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              {services.cta.subheading}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-base"
            >
              {services.cta.buttonLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
