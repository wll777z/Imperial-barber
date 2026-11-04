import {
  ArrowUpRight,
  ArrowRight,
  Scissors,
  ShieldCheck,
  Gem,
  CalendarDays,
  CreditCard,
  Crown,
  MapPin,
  Clock,
  Phone,
  Camera,
  Mail,
  Check,
  Quote,
} from "lucide-react";
import { getPublicContent } from "@/lib/content";
import { formatMoney } from "@/lib/format";
import { BookingLauncher } from "@/features/booking/wizard";
import Header from "@/components/site/header";
import Brand from "@/components/site/brand";
import HeroVisual from "@/components/site/hero-visual";
import WorkGallery from "@/components/site/work-gallery";
import { workPhotos } from "@/lib/portfolio";
export const dynamic = "force-dynamic";
export default async function Home() {
  const c = await getPublicContent();
  const s = c.settings;
  const benefitIcons = [Scissors, Gem, CalendarDays, CreditCard, ShieldCheck];
  return (
    <>
      <Header content={c} />
      <main>
        <section className="hero" id="inicio">
          <HeroVisual image={s.heroImage} />
          <div className="hero-shade" />
          <div className="container hero-content">
            <p className="eyebrow">{s.eyebrow}</p>
            <h1>
              {s.heroTitle === "Mais que um corte, um estilo Imperial." ? (
                <>
                  Mais que um corte,
                  <br />
                  um estilo <em>Imperial.</em>
                </>
              ) : (
                s.heroTitle
              )}
            </h1>
            <p className="hero-description">{s.heroDescription}</p>
            <div className="hero-actions">
              <BookingLauncher content={c} className="button">
                {s.heroPrimaryCta} <ArrowUpRight size={18} />
              </BookingLauncher>
              <a href="#servicos" className="button button-outline">
                {s.heroSecondaryCta} <ArrowRight size={17} />
              </a>
            </div>
            <div className="hero-signature">
              <div className="signature-seal">
                <Crown size={24} />
              </div>
              <div>
                <span>{s.heroSignatureTitle}</span>
                <p>{s.heroSignatureText}</p>
              </div>
            </div>
          </div>
          <div className="hero-index">
            <span>01</span>
            <div />
            <span>ESTILO IMPERIAL</span>
          </div>
        </section>
        <section className="benefit-strip" id="sobre">
          <div className="container benefits">
            {s.benefits.map((b, i) => {
              const Icon = benefitIcons[i % 5];
              return (
                <div key={i}>
                  <Icon strokeWidth={1.25} />
                  <span>{b}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="section services-section" id="servicos">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow dark">{s.servicesEyebrow}</p>
                <h2>{s.servicesTitle}</h2>
              </div>
              <p className="preline">{s.servicesDescription}</p>
            </div>
            {(!c.configured || c.demo) && (
              <p className="catalog-note">
                Ambiente de demonstração · catálogo inicial · valores
                demonstrativos, sujeitos à configuração da barbearia.
              </p>
            )}
            <div className="services-grid">
              {c.services.map((service, i) => (
                <article className="service-card" key={service.id}>
                  <div
                    className={`service-photo ${!service.imageUrl || service.imageUrl === "/images/services.jpg" ? `service-sheet service-photo-${i % 6}` : ""}`}
                    style={{
                      backgroundImage: `url("${service.imageUrl || "/images/services.jpg"}")`,
                    }}
                  >
                    <span className="service-number">0{i + 1}</span>
                  </div>
                  <div className="service-card-content">
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <div className="service-meta">
                      <span>{formatMoney(service.priceCents)}</span>
                      <small>{service.durationMinutes} min</small>
                    </div>
                    <BookingLauncher
                      content={c}
                      serviceId={service.id}
                      className="service-link"
                    >
                      {s.serviceCta} <ArrowUpRight size={16} />
                    </BookingLauncher>
                  </div>
                </article>
              ))}
            </div>
            {c.services.length === 0 && (
              <p className="empty-state">
                Nossos serviços estarão disponíveis em breve. Tente novamente
                mais tarde.
              </p>
            )}
          </div>
        </section>
        <WorkGallery photos={workPhotos}>
          <BookingLauncher content={c} className="button">
            Agendar meu horário <ArrowUpRight size={18} />
          </BookingLauncher>
        </WorkGallery>
        <section className="booking-banner" id="agendamento">
          <div
            className="booking-banner-photo"
            style={{
              backgroundImage: `linear-gradient(90deg,#0c0e0b40,#10120ff2 46%,#10120f 65%),url("${s.bookingImage}")`,
              backgroundSize:
                s.bookingImage === "/images/services.jpg"
                  ? "cover,300% 200%"
                  : "cover,cover",
              backgroundPosition: "center,right bottom",
            }}
          />
          <div className="container booking-banner-inner">
            <div className="booking-copy">
              <p className="eyebrow">{s.bookingEyebrow}</p>
              <h2>{s.bookingTitle}</h2>
              <p>{s.bookingDescription}</p>
              <BookingLauncher content={c} className="button">
                {s.bookingCta} <ArrowUpRight size={18} />
              </BookingLauncher>
            </div>
            <div className="steps-panel">
              <p className="eyebrow">{s.stepsEyebrow}</p>
              <h3>{s.stepsTitle}</h3>
              <div className="how-steps">
                {s.steps.map((step, i) => {
                  const Icon = [Scissors, CalendarDays, Check][i];
                  return (
                    <div key={i}>
                      <div className="step-icon">
                        <Icon strokeWidth={1.3} />
                        <span>0{i + 1}</span>
                      </div>
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
        {s.showTeam && (
          <section className="section team-section" id="equipe">
            <div className="container">
              <div className="section-heading">
                <div>
                  <p className="eyebrow dark">{s.teamEyebrow}</p>
                  <h2>{s.teamTitle}</h2>
                </div>
                <p className="preline">{s.teamDescription}</p>
              </div>
              {c.professionals.length ? (
                <div className="team-grid">
                  {c.professionals.map((p) => (
                    <article className="team-card" key={p.id}>
                      <img
                        src={p.imageUrl || "/images/hero.jpg"}
                        alt={p.name}
                        loading="lazy"
                      />
                      <div>
                        <h3>{p.name}</h3>
                        <p>{p.specialty}</p>
                        <BookingLauncher content={c} className="service-link">
                          {s.teamCta} <ArrowUpRight size={16} />
                        </BookingLauncher>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="team-intro">
                  <div
                    className="team-intro-image"
                    style={{ backgroundImage: `url("${s.teamIntroImage}")` }}
                  />
                  <div>
                    <Scissors size={36} strokeWidth={1} />
                    <h3>{s.teamIntroTitle}</h3>
                    <p>{s.teamIntroDescription}</p>
                    <p className="muted">{s.teamIntroNote}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        {s.showTestimonials && s.testimonials.length > 0 && (
          <section className="testimonials section">
            <div className="container">
              <p className="eyebrow">{s.testimonialsEyebrow}</p>
              <h2>{s.testimonialsTitle}</h2>
              <div className="testimonial-grid">
                {s.testimonials.map((t, i) => (
                  <figure key={i}>
                    <Quote />
                    <blockquote>{t.text}</blockquote>
                    <figcaption>{t.name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}
        <section className="location-section" id="contato">
          <div className="container location-inner">
            <div>
              <p className="eyebrow">{s.contactEyebrow}</p>
              <h2 className="preline">{s.contactTitle}</h2>
              <BookingLauncher content={c} className="button">
                {s.contactCta} <ArrowUpRight size={18} />
              </BookingLauncher>
            </div>
            <div className="contact-details">
              {s.showLocation && s.address && s.locationImage && (
                <img
                  className="location-photo"
                  src={s.locationImage}
                  alt="Nosso espaço"
                  loading="lazy"
                />
              )}
              <h3>{s.contactHeading}</h3>
              {s.showLocation && s.address ? (
                <p>
                  <MapPin />
                  {s.address}
                </p>
              ) : (
                <p>
                  <MapPin />
                  Endereço disponível em breve.
                </p>
              )}
              <p>
                <Clock />
                {s.hoursText}
              </p>
              {s.phone && (
                <a
                  href={`https://wa.me/${s.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone />
                  {s.phone}
                </a>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`}>
                  <Mail />
                  {s.email}
                </a>
              )}
              {s.showLocation && s.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  Ver no mapa <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="container footer-main">
          <div>
            <Brand small logoUrl={s.logoUrl} />
            <p>{s.footerText}</p>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="#servicos">Nossos serviços</a>
            <a href="#equipe">Nossa equipe</a>
            <a href="#agendamento">Agendamento</a>
          </div>
          <div>
            <h4>Vamos conversar</h4>
            {s.email ? (
              <a href={`mailto:${s.email}`}>{s.email}</a>
            ) : (
              <p>Contato em breve.</p>
            )}
            {s.instagram && (
              <a href={s.instagram} target="_blank" rel="noopener noreferrer">
                <Camera size={16} /> Camera
              </a>
            )}
            {s.facebook && (
              <a href={s.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            )}
          </div>
          <div className="footer-statement">
            <Crown strokeWidth={1} />
            <p className="preline">{s.footerSlogan}</p>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} Imperial Barber. Todos os direitos
            reservados.
          </span>
          <div>
            <a href="/privacidade">Privacidade</a>
            <a href="/admin">
              Área do profissional <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
