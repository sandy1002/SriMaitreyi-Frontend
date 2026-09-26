import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { HeartPulse, Lightbulb, Shield, Globe } from 'lucide-react';
import { about } from '@/marketing/content';

const valueIcons: Record<string, React.ReactNode> = {
  'heart-pulse': <HeartPulse className="w-5 h-5" />,
  lightbulb: <Lightbulb className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
};

export function AboutPage() {
  const site = 'https://srimae.com';
  const url = `${site}/about`;
  const title = 'About Srimae — Our Mission & Team';
  const description = 'Learn how Srimae is transforming healthcare through AI-powered clinical intelligence, and meet the team behind the platform.';

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
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          '@id': `${url}#webpage`,
          name: title,
          url,
          isPartOf: { '@id': `${site}/#website` },
          about: { '@id': `${site}/#organization` },
        })}</script>
      </Helmet>

      <main>
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary-foreground/60 mb-4 border border-primary-foreground/20 px-3 py-1 rounded-full">
              {about.hero.eyebrow}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              {about.hero.heading}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
              {about.hero.subheading}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-foreground mb-8">
              {about.story.heading}
            </h2>
            {about.story.paragraphs.map((p, i) => (
              <p key={i} className="text-muted-foreground text-lg leading-relaxed mb-6">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="bg-muted py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-foreground">Our Core Values</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {about.values.map((value) => (
                <div key={value.id} className="bg-background rounded-xl p-8 border border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-5">
                    {valueIcons[value.icon] ?? <Shield className="w-5 h-5" />}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {about.team.heading}
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {about.team.subheading}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {about.team.members.map((member) => (
                <div key={member.id} className="bg-card border border-border rounded-xl p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-4">
                    {member.initials}
                  </div>
                  <p className="font-semibold text-foreground text-sm">
                    {member.name}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary text-primary-foreground py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {about.cta.heading}
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10">
              {about.cta.subheading}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-button)] bg-primary-foreground text-primary font-semibold hover:opacity-90 transition-opacity"
              >
                {about.cta.primaryLabel}
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-[var(--radius-button)] border border-primary-foreground/30 text-primary-foreground font-semibold hover:bg-primary-foreground/10 transition-colors"
              >
                {about.cta.secondaryLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
