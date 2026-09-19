import { resolveDialysisLoginHref } from '@/marketing/config';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Minus } from 'lucide-react';
import { pricing } from '@/marketing/content';

type PricingPlan = {
  id: string;
  name: string;
  price: { monthly: string; annual: string };
  description: string;
  cta: string;
  ctaHref: string;
  ctaExternal: boolean;
  highlighted: boolean;
  badge?: string;
  features: string[];
};

export function PricingPage() {
  const site = 'https://srimae.com';
  const url = `${site}/pricing`;
  const title = 'Pricing — Srimae';
  const description =
  'Simple, transparent pricing for the Srimae Dialysis Companion App and AI Clinical Solutions. Plans for individual patients, clinicians, and enterprise health systems.';

  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const cardBase =
  'relative flex flex-col rounded-2xl border p-8 transition-shadow hover:shadow-lg';
  const cardHighlighted = 'border-primary bg-primary text-primary-foreground shadow-xl scale-[1.02]';
  const cardNormal = 'border-border bg-card';

  const ctaOutline =
  'w-full inline-flex items-center justify-center gap-2 border border-primary text-primary font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:bg-primary/5 transition-colors text-sm';
  const ctaHighlighted =
  'w-full inline-flex items-center justify-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-sm';

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
            about: { '@id': `${site}/#organization` }
          })}
        </script>
      </Helmet>

      <main>
        {/* ── Hero ── */}
        <section className="bg-primary text-primary-foreground py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary-foreground/60 mb-4 border border-primary-foreground/20 px-3 py-1 rounded-full">
              {pricing.hero.eyebrow}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {pricing.hero.heading}
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed mb-8">
              {pricing.hero.subheading}
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                billing === 'monthly' ?
                'bg-white text-primary' :
                'text-primary-foreground/70 hover:text-primary-foreground'}`
                }>
                
                {pricing.toggle.monthly}
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                billing === 'annual' ?
                'bg-white text-primary' :
                'text-primary-foreground/70 hover:text-primary-foreground'}`
                }>
                
                {pricing.toggle.annual}
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">
                  {pricing.toggle.annualBadge}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Dialysis App Pricing ── */}
        <section className="py-20 md:py-24 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center gap-3 mb-4">
                <img
                  src="/logo.png"
                  alt="Dialysis App icon"
                  className="w-8 h-8 object-contain"
                  loading="lazy" />
                
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {pricing.dialysis.heading}
                </h2>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {pricing.dialysis.subheading}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {(pricing.dialysis.plans as PricingPlan[]).map((plan) =>
              <div
                key={plan.id}
                className={`${cardBase} ${plan.highlighted ? cardHighlighted : cardNormal}`}>
                
                  {plan.badge &&
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full ${
                  plan.highlighted ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'}`
                  }>
                  
                      {plan.badge}
                    </span>
                }

                  {/* Plan name & description */}
                  <div className="mb-6">
                    <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm leading-relaxed ${plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    {plan.price.monthly === 'Custom' ?
                  <span className={`text-3xl font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                        Custom
                      </span> :

                  <div className="flex items-end gap-1">
                        <span className={`text-4xl font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                          ${billing === 'annual' ? plan.price.annual : plan.price.monthly}
                        </span>
                        <span className={`text-sm mb-1.5 ${plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          / mo
                        </span>
                      </div>
                  }
                    {plan.price.monthly !== 'Custom' && billing === 'annual' &&
                  <p className={`text-xs mt-1 ${plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        Billed annually
                      </p>
                  }
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {plan.features.map((feature, i) =>
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-white' : 'text-primary'}`} />
                        <span className={plan.highlighted ? 'text-primary-foreground/90' : 'text-foreground'}>
                          {feature}
                        </span>
                      </li>
                  )}
                  </ul>

                  {/* CTA */}
                  {plan.ctaExternal ?
                <a
                  href={resolveDialysisLoginHref(plan.ctaHref)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={plan.highlighted ? ctaHighlighted : ctaOutline}>
                  
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </a> :

                <Link to="/contact" className={plan.highlighted ? ctaHighlighted : ctaOutline}>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                }
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="border-t border-border" />
        </div>

        {/* ── AI Clinical Solutions Pricing ── */}
        <section className="py-20 md:py-24 bg-background">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {pricing.clinical.heading}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {pricing.clinical.subheading}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {(pricing.clinical.plans as PricingPlan[]).map((plan) =>
              <div
                key={plan.id}
                className={`${cardBase} ${plan.highlighted ? cardHighlighted : cardNormal}`}>
                
                  {plan.badge &&
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full ${
                  plan.highlighted ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'}`
                  }>
                  
                      {plan.badge}
                    </span>
                }

                  <div className="mb-6">
                    <h3 className={`text-lg font-bold mb-1 ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm leading-relaxed ${plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    {plan.price.monthly === 'Custom' ?
                  <span className={`text-3xl font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                        Custom
                      </span> :

                  <div className="flex items-end gap-1">
                        <span className={`text-4xl font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                          ${billing === 'annual' ? plan.price.annual : plan.price.monthly}
                        </span>
                        <span className={`text-sm mb-1.5 ${plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          / mo
                        </span>
                      </div>
                  }
                    {plan.price.monthly !== 'Custom' && billing === 'annual' &&
                  <p className={`text-xs mt-1 ${plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        Billed annually
                      </p>
                  }
                  </div>

                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {plan.features.map((feature, i) =>
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-white' : 'text-primary'}`} />
                        <span className={plan.highlighted ? 'text-primary-foreground/90' : 'text-foreground'}>
                          {feature}
                        </span>
                      </li>
                  )}
                  </ul>

                  <Link to="/contact" className={plan.highlighted ? ctaHighlighted : ctaOutline}>
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 md:py-24 bg-muted">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              {pricing.faq.heading}
            </h2>
            <div className="flex flex-col gap-4">
              {pricing.faq.items.map((item) =>
              <div key={item.id} className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-foreground mb-2 flex items-start gap-2">
                    <Minus className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{item.question}</span>
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed pl-6">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="py-20 md:py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {pricing.cta.heading}
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10">
              {pricing.cta.subheading}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-4 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-base">
              
              {pricing.cta.buttonLabel}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
    </>);

}