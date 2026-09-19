import { Helmet } from 'react-helmet-async';
import { Mail, MapPin, Clock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { contact } from '@/marketing/content';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

const infoIcons: Record<string, React.ReactNode> = {
  mail: <Mail className="w-5 h-5" />,
  'map-pin': <MapPin className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
};

export function ContactPage() {
  const site = 'https://srimae.com';
  const url = `${site}/contact`;
  const title = 'Contact Srimae — Request a Demo';
  const description =
    'Get in touch with the Srimae team to request a demo or learn how our AI-powered clinical intelligence platform can transform your practice.';

  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check — abort silently if filled by a bot
    if (formData.get('_gotcha')) return;

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const role = String(formData.get('role') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();

    setStatus('sending');
    setErrorMsg('');

    try {
      // Field mapping: only the message textarea goes in messages_attributes[0].body.
      // All other fields (role) must be added to conversation.data as { "Label": value } pairs.
      const res = await fetch('/api/contact/contact-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation: {
            messages_attributes: [{ body: message || 'New contact form submission' }],
            data: {
              __gd_contact_form_title: 'Contact Srimae',
              'Role / Specialty': role || 'Not provided',
            },
          },
          user: { email, name },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatus('success');
        form.reset();
      } else {
        throw new Error(json.error || 'Something went wrong.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    }
  }

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
            '@type': 'ContactPage',
            '@id': `${url}#webpage`,
            name: title,
            url,
            isPartOf: { '@id': `${site}/#website` },
            about: { '@id': `${site}/#organization` },
          })}
        </script>
      </Helmet>

      <main>
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {contact.hero.heading}
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              {contact.hero.subheading}
            </p>
          </div>
        </section>

        {/* Form + Info */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

              {/* Contact Form */}
              <div className="lg:col-span-3">
                {status === 'success' ? (
                  <div className="bg-card border border-border rounded-xl p-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
                      <Mail className="w-7 h-7" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">Message Sent!</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Thank you for reaching out. Our team will get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="bg-card border border-border rounded-xl p-8 flex flex-col gap-5"
                  >
                    {/* Honeypot — hidden from real users, never sent in POST body */}
                    <input
                      type="text"
                      name="_gotcha"
                      tabIndex={-1}
                      autoComplete="off"
                      style={{ position: 'absolute', left: '-9999px' }}
                      aria-hidden="true"
                    />

                    <h2 className="text-2xl font-bold text-foreground mb-2">Send us a message</h2>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="name" className="text-sm font-medium text-foreground">
                        Full name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder={contact.form.namePlaceholder}
                        className="border border-input rounded-[var(--radius-button)] px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="email" className="text-sm font-medium text-foreground">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder={contact.form.emailPlaceholder}
                        className="border border-input rounded-[var(--radius-button)] px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="role" className="text-sm font-medium text-foreground">
                        Role / Specialty
                      </label>
                      <input
                        id="role"
                        name="role"
                        type="text"
                        placeholder={contact.form.rolePlaceholder}
                        className="border border-input rounded-[var(--radius-button)] px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="message" className="text-sm font-medium text-foreground">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        placeholder={contact.form.messagePlaceholder}
                        className="border border-input rounded-[var(--radius-button)] px-4 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>

                    {status === 'error' && (
                      <p role="alert" className="text-sm text-destructive">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'sending'}
                      className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-[var(--radius-button)] hover:opacity-90 transition-opacity text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === 'sending' ? 'Sending…' : contact.form.submitLabel}
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div className="lg:col-span-2 flex flex-col gap-6 justify-start pt-2">
                <h2 className="text-2xl font-bold text-foreground">Contact information</h2>
                {contact.info.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      {infoIcons[item.icon] ?? <Mail className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
