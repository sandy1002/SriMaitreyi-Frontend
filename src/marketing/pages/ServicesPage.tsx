import { DIALYSIS_APP_LOGIN_URL, isExternalLoginUrl } from '@/marketing/config';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Building2,
  FlaskConical,
  Droplets,
  Utensils,
  BarChart2,
  Weight,
  FlaskConical as Beaker,
  NotebookPen,
  Shield,
} from 'lucide-react';
import { services } from '@/marketing/content';

const serviceIcons: Record<string, React.ReactNode> = {
  sv1: <Stethoscope className="w-7 h-7" />,
  sv2: <Building2 className="w-7 h-7" />,
  sv3: <FlaskConical className="w-7 h-7" />,
  sv4: <Shield className="w-7 h-7" />,
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

function DialysisLoginButton({ className }: { className: string }) {
  if (isExternalLoginUrl(DIALYSIS_APP_LOGIN_URL)) {
    return (
      <a
        href={DIALYSIS_APP_LOGIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <LoginIcon />
        Login to Dialysis App
      </a>
    );
  }
  return (
    <Link to={DIALYSIS_APP_LOGIN_URL} className={className}>
      <LoginIcon />
      Login to Dialysis App
    </Link>
  );
}

function LoginIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

export function ServicesPage() {
  const site = 'https://srimae.com';
  const url = `${site}/services`;
  const title = 'Services & Products — Srimae';
  const description =
    "Explore Srimae's clinical decision support, population health analytics, research intelligence, and the Dialysis Companion App — AI-powered tools built for healthcare professionals.";

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
      </Helmet>

      <main>
        {/* Hero — matches default-2-site */}
        <section className="ombre-btn py-4 md:py-6">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary-foreground/60 mb-4 border border-primary-foreground/20 px-3 py-1 rounded-full">
              {services.hero.eyebrow}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              {services.hero.heading}
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              {services.hero.subheading}
            </p>
          </div>
        </section>

        {/* Sticky tabs */}
        <section className="border-b border-border bg-background sticky top-16 z-10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div role="group" aria-label="Services navigation" className="flex gap-0">
              {services.tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.id === 'tab-dialysis' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {tab.label}
                    </span>
                  ) : (
                    tab.label
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Clinical Services */}
        {activeTab === 'tab-services' && (
          <section className="py-20 md:py-24">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-14 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold ombre-text mb-4">
                  {services.clinicalServices.heading}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {services.clinicalServices.subheading}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {services.clinicalServices.items.map((service) => (
                  <div
                    key={service.id}
                    className="bg-card rounded-2xl border border-border p-8 flex flex-col hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-xl ombre-btn flex items-center justify-center">
                        {serviceIcons[service.id] ?? <CheckCircle2 className="w-7 h-7" />}
                      </div>
                      <span className="text-xs font-semibold ombre-text bg-primary/10 px-3 py-1 rounded-full">
                        {service.tag}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                      {service.description}
                    </p>
                    <ul className="flex flex-col gap-2 mb-6">
                      {service.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                    {'ctaHref' in service && service.ctaHref ? (
                      <Link
                        to={String(service.ctaHref)}
                        className="inline-flex items-center justify-center gap-2 ombre-btn font-semibold px-4 py-3 rounded-[var(--radius-button)] text-sm mt-auto"
                      >
                        {'ctaLabel' in service && service.ctaLabel
                          ? String(service.ctaLabel)
                          : 'Learn more'}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Dialysis App */}
        {activeTab === 'tab-dialysis' && (
          <section className="py-20 md:py-24">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="flex flex-col items-center text-center mb-10 max-w-2xl mx-auto">
                <img
                  src="/assets/images/recreate-this-kidney-pair-as-a-flat-icon-sUuniG.png"
                  alt="Kidney pair icon"
                  className="w-28 h-28 object-contain mb-5"
                />
                <span className="inline-flex items-center gap-2 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full mb-5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {services.dialysisApp.badge}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold ombre-text mb-4">
                  {services.dialysisApp.heading}
                </h2>
                <DialysisLoginButton className="inline-flex items-center gap-2 ombre-btn font-semibold px-8 py-4 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-base mb-6" />
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  {services.dialysisApp.subheading}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 border border-primary ombre-text font-semibold px-8 py-4 rounded-[var(--radius-button)] hover:bg-primary/5 transition-colors text-base"
                  >
                    {services.dialysisApp.ctaLabel}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {services.dialysisApp.features.map((feat) => (
                  <div
                    key={feat.id}
                    className="bg-card border border-border rounded-xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-lg ombre-text font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {dialysisIcons[feat.id] ?? <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm mb-1">{feat.title}</p>
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

        <section className="bg-muted py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold ombre-text mb-4">{services.cta.heading}</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              {services.cta.subheading}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 ombre-btn font-semibold px-8 py-4 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-base"
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
