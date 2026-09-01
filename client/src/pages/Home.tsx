// Broadcast Atelier direction: the public page remains a warm, asymmetric editorial broadcast while every story, image, and contact detail comes from the Blue Decore studio.
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Camera, ChevronDown,
  Facebook, Globe2, Instagram, LogIn, Mail, MapPin, Menu, Mic2, Moon, Play,
  Radio, Send, Sparkles, Sun, X, Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/lib/api";

const asset = { mark: "/manus-storage/kasha-signal-mark_87b5eda2.png" };

const celebrationPackages = [
  { id: "weddings", title: "Wedding Moments", subtitle: "Ceremony + reception", tag: "Weddings", description: "Romantic blue-and-ivory styling, floral moments, and a beautiful setting for your yes.", imageUrl: "/images/blue-decore/weddings.jpg", featureTitle: "A day worth remembering", featureSubtitle: "Blue, soft, and entirely yours" },
  { id: "birthdays", title: "Birthday Joy", subtitle: "Milestones + surprises", tag: "Birthdays", description: "Playful, polished décor that makes every age and every guest feel celebrated.", imageUrl: "/images/blue-decore/birthdays.jpg", featureTitle: "Make a little more magic", featureSubtitle: "Bright details for the big day" },
  { id: "graduations", title: "Graduate Glow", subtitle: "Photo moments + parties", tag: "Graduations", description: "A proud, photo-ready celebration for the next chapter, styled in confident blue.", imageUrl: "/images/blue-decore/graduations.jpg", featureTitle: "Celebrate the next chapter", featureSubtitle: "A setting made for proud photos" },
  { id: "baby-showers", title: "Baby Showers", subtitle: "Sweet beginnings", tag: "Baby showers", description: "Gentle, joyful styling for welcoming a new little love and gathering your people.", imageUrl: "/images/blue-decore/baby-showers.jpg", featureTitle: "The sweetest beginning", featureSubtitle: "Soft details, warm memories" },
] as const;

const decorServices = [
  { title: "Wedding Décor", description: "From ceremony backdrops to reception tables, we style the whole love story.", image: "/images/blue-decore/weddings.jpg", label: "Wedding décor" },
  { title: "Birthday Décor", description: "Beautiful balloons, cake tables, and cheerful details made for your moment.", image: "/images/blue-decore/birthdays.jpg", label: "Birthday décor" },
  { title: "Graduation Décor", description: "Blue-forward photo corners and party styling for every proud achievement.", image: "/images/blue-decore/graduations.jpg", label: "Graduation décor" },
  { title: "Baby Shower Décor", description: "Soft, joyful styling for a beautiful welcome and a room full of love.", image: "/images/blue-decore/baby-showers.jpg", label: "Baby shower décor" },
] as const;

const labels = {
  en: { about: "About", programs: "Collections", services: "Services", journal: "Ideas", talk: "Let's plan", admin: "Admin", why: "Why Blue Decore", weekly: "Weekly studio note", readStory: "Meet the studio", viewNotes: "View our ideas", name: "Name", email: "Email", brief: "What are you celebrating?", send: "Send the note", placeholderName: "Your name", placeholderEmail: "you@example.com", placeholderBrief: "A wedding, birthday, graduation..." },
  am: { about: "ስለ እኛ", programs: "ስብስቦች", services: "አገልግሎቶች", journal: "ሀሳቦች", talk: "እንነጋገር", admin: "አስተዳዳሪ", why: "ለምን Blue Decore", weekly: "የስቱዲዮ ማስታወሻ", readStory: "ስቱዲዮውን ያግኙ", viewNotes: "ሀሳቦቻችንን ይመልከቱ", name: "ስም", email: "ኢሜይል", brief: "ምን እያከበሩ ነው?", send: "መልዕክቱን ይላኩ", placeholderName: "ስምዎ", placeholderEmail: "you@example.com", placeholderBrief: "ሰርግ፣ ልደት፣ ምርቃት..." },
} as const;

function scrollToId(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }

function LoadingSignal() {
  return <main className="kasha-page"><section className="hero"><div className="hero-scrim" /><div className="hero-content section-wrap"><div className="hero-copy"><p className="eyebrow eyebrow-light">Loading the signal</p><h1>Making room<br /><em>for the story.</em></h1><p className="hero-intro">The Blue Decore studio is bringing today&apos;s programme into focus.</p></div></div></section></main>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState<"en" | "am">(() => (localStorage.getItem("kasha-language") as "en" | "am") || "en");
  const copy = labels[language];
  const homepage = api.public.homepage.useQuery(undefined, { refetchOnWindowFocus: false, retry: 1 });
  const submitInquiry = api.public.submitInquiry.useMutation();

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 28);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => { localStorage.setItem("kasha-language", language); document.documentElement.lang = language === "am" ? "am" : "en"; }, [language]);

  const content = homepage.data;
  const featuredProgram = celebrationPackages[0];

  if (homepage.isError) return <main className="kasha-page"><section className="hero"><div className="hero-scrim" /><div className="hero-content section-wrap"><div className="hero-copy"><p className="eyebrow eyebrow-light">Signal interrupted</p><h1>We&apos;ll be back<br /><em>shortly.</em></h1><p className="hero-intro">The Blue Decore studio could not load the current broadcast. Please refresh this page.</p></div></div></section></main>;
  if (homepage.isLoading || !content?.settings) return <LoadingSignal />;

  const { settings: contentSettings, journalEntries } = content;
  const settings = {
    ...contentSettings,
    siteName: "Blue Decore",
    brandLine: "Celebrations, styled beautifully",
    heroEyebrow: "Events made memorable",
    heroTitle: "Make the moment",
    heroAccent: "feel unforgettable.",
    heroIntro: "Friendly, thoughtful décor for weddings, birthdays, graduations, baby showers, and every beautiful reason to gather.",
    heroCtaLabel: "Plan your celebration",
    heroImageUrl: "/images/blue-decore/celebration-reference.jpg",
    heroAsideTitle: "Weddings • birthdays • graduations",
    heroAsideBody: "One warm studio for the moments your people will remember.",
    heroFooterIndex: "01 / 06",
    heroFooterDescriptor: "Event décor + joyful details + beautiful memories",
    tickerItems: "Weddings|Birthdays|Graduations|Baby showers|Special occasions",
    aboutEyebrow: "The Blue Decore approach",
    aboutRailLabel: "About the studio",
    aboutTitle: "Beautiful details",
    aboutAccent: "for every reason.",
    aboutBody: "We create welcoming celebration spaces with a confident blue point of view, thoughtful details, and a friendly process from first idea to final photo.",
    aboutQuote: "The best décor makes people feel at home in the moment.",
    aboutImageUrl: "/images/blue-decore/weddings.jpg",
    aboutCaptionLeft: "Blue tablescape / Event styling",
    aboutCaptionRight: "Joy, detail, and a little sparkle",
    programsEyebrow: "Celebration collections",
    programsRailLabel: "Choose your moment",
    programsTitle: "A beautiful setting",
    programsAccent: "starts here.",
    programsSummary: "Tell us what you are celebrating and we will shape the colors, details, and atmosphere around it.",
    audioImageLabel: "Blue Decore / Celebration mood",
    audioCaptionLabel: "A little inspiration",
    servicesEyebrow: "What we style",
    servicesRailLabel: "Décor for every occasion",
    servicesTitle: "Bring your people",
    servicesAccent: "we’ll bring the magic.",
    servicesSummary: "From intimate family moments to proud student milestones, we make the room feel as special as the reason you gathered.",
    eventEyebrow: "Next celebration",
    eventTitle: "Your moment",
    eventAccent: "deserves the details.",
    eventBody: "Whether it is your wedding day, a birthday surprise, a graduation party, or a baby shower, Blue Decore is here to make it feel warm, joyful, and completely yours.",
    eventCtaLabel: "Start planning",
    eventImageUrl: "/images/blue-decore/graduations.jpg",
    eventImageLabel: "Blue-forward celebration / Photo-ready",
    journalEyebrow: "Notes from the studio",
    journalRailLabel: "Ideas for your day",
    journalTitle: "Little details",
    journalAccent: "big feeling.",
    contactEyebrow: "Let’s make a plan",
    contactRailLabel: "Start your celebration",
    contactTitle: "Tell us",
    contactAccent: "what you’re dreaming.",
    contactBody: "Share the occasion, the date, and the feeling you want your guests to leave with. We’ll come back with a thoughtful first idea.",
    footerBuiltLine: "Styled with care / Made for your people",
  };
  const tickerItems = settings.tickerItems.split("|").map((item: string) => item.trim()).filter(Boolean);
  const tickerSequence = [...tickerItems, ...tickerItems.slice(0, 2)];
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    submitInquiry.mutate({ name: String(values.get("name") ?? ""), email: String(values.get("email") ?? ""), brief: String(values.get("brief") ?? "") }, {
      onSuccess: () => { toast.success("Your note reached the Blue Decore studio.", { description: "We’ll be in touch through the contact details you shared." }); form.reset(); },
      onError: () => toast.error("Your note could not be sent.", { description: "Please try again in a moment." }),
    });
  };
  const closeMenu = () => setMenuOpen(false);
  const onPlaceholder = (label: string) => toast(`${label} is being prepared for the next broadcast.`, { description: "We’re shaping a calm, considered space for you." });

  return (
    <div className="kasha-page">
      <header className={`site-header ${hasScrolled ? "is-scrolled" : ""}`}>
        <a className="brand" href="#top" aria-label={`${settings.siteName} ${settings.brandLine} home`} onClick={closeMenu}>
          <img src={asset.mark} alt="" className="brand-mark" />
          <span className="brand-wordmark"><strong>{settings.siteName}</strong><span>{settings.brandLine}</span></span>
        </a>
        <div className="header-tools">
          <button className="header-tool" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={15} /> : <Sun size={15} />}</button>
          <button className="header-tool language-tool" type="button" onClick={() => setLanguage((value) => value === "en" ? "am" : "en")} aria-label="Switch language"><Globe2 size={15} /><span>{language === "am" ? "EN" : "አማ"}</span></button>
          <a className="header-tool admin-tool" href="/admin"><LogIn size={15} /><span>{copy.admin}</span></a>
        </div>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
          <a href="#about" onClick={closeMenu}>{copy.about}</a><a href="#programs" onClick={closeMenu}>{copy.programs}</a><a href="#services" onClick={closeMenu}>{copy.services}</a><a href="#journal" onClick={closeMenu}>{copy.journal}</a>
          <a className="nav-contact" href="#contact" onClick={closeMenu}>{copy.talk} <ArrowUpRight size={15} /></a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-image" style={{ backgroundImage: `url(${settings.heroImageUrl})` }} aria-hidden="true" /><div className="hero-scrim" aria-hidden="true" />
          <div className="hero-content section-wrap"><div className="hero-copy"><p className="eyebrow eyebrow-light"><span className="live-dot" /> {settings.heroEyebrow}</p><h1 id="hero-heading">{settings.heroTitle}<br /><em>{settings.heroAccent}</em></h1><p className="hero-intro">{settings.heroIntro}</p><div className="hero-actions"><a className="button button-signal" href="#programs">{settings.heroCtaLabel} <ArrowDownRight size={17} /></a><button className="text-link text-link-light" type="button" onClick={() => scrollToId("about")}>{copy.why} <ArrowRight size={16} /></button></div></div><div className="hero-aside"><div className="hero-aside-top"><Radio size={16} /><span>{copy.weekly}</span></div><strong>{settings.heroAsideTitle}</strong><span className="hero-aside-note">{settings.heroAsideBody}</span><div className="waveform" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div></div>
          <div className="hero-footer section-wrap"><span>{settings.heroFooterIndex}</span><span>{settings.heroFooterDescriptor}</span><a href="#about" aria-label={`Scroll to ${settings.aboutRailLabel}`}><ChevronDown size={18} /></a></div>
        </section>

        <div className="ticker" aria-label={`${settings.siteName} focus areas`}><div className="ticker-inner">{tickerSequence.map((item, index) => <span key={`${item}-${index}`} className="ticker-item">{item}{index < tickerSequence.length - 1 && <i aria-hidden="true" />}</span>)}</div></div>

        <section className="about-section section-wrap section-space" id="about" aria-labelledby="about-heading"><div className="section-rail"><span>02</span><span>{settings.aboutRailLabel}</span></div><div className="about-grid"><div className="about-copy"><p className="eyebrow">{settings.aboutEyebrow}</p><h2 id="about-heading">{settings.aboutTitle} <em>{settings.aboutAccent}</em></h2><p className="body-large">{settings.aboutBody}</p><blockquote>“{settings.aboutQuote}”</blockquote><button className="text-link" type="button" onClick={() => onPlaceholder(settings.aboutRailLabel)}>{copy.readStory} <ArrowRight size={16} /></button></div><figure className="editorial-figure"><div className="image-frame image-frame-tall"><img src={settings.aboutImageUrl} alt={settings.aboutCaptionLeft} /></div><figcaption><span>{settings.aboutCaptionLeft}</span><span>{settings.aboutCaptionRight}</span></figcaption></figure></div></section>

        <section className="programs-section section-space" id="programs" aria-labelledby="programs-heading"><div className="section-wrap"><div className="section-rail"><span>03</span><span>{settings.programsRailLabel}</span></div><div className="section-heading-row"><div><p className="eyebrow">{settings.programsEyebrow}</p><h2 id="programs-heading">{settings.programsTitle}<br /><em>{settings.programsAccent}</em></h2></div><p className="section-summary">{settings.programsSummary}</p></div><div className="programs-layout"><div className="program-list">{celebrationPackages.map((program, index) => <button className="program-row" type="button" key={program.id} onClick={() => onPlaceholder(program.title)}><span className="program-index">{String(index + 1).padStart(2, "0")}</span><span className="program-name"><strong>{program.title}</strong><small>{program.subtitle}</small></span><span className="program-detail">{program.description}</span><span className="program-tag">{program.tag}</span><ArrowUpRight size={19} className="program-arrow" /></button>)}</div><div className="audio-feature"><div className="audio-image"><img src={featuredProgram?.imageUrl || settings.heroImageUrl} alt={featuredProgram?.title ?? settings.audioCaptionLabel} /><span className="image-label">{settings.audioImageLabel}</span></div><button className={`play-button ${playing ? "is-playing" : ""}`} type="button" aria-label={playing ? "Pause sample" : "Play sample"} onClick={() => { setPlaying((value) => !value); toast(playing ? "Inspiration paused." : "A little Blue Decore inspiration."); }}>{playing ? <span className="pause-bars"><i /><i /></span> : <Play size={20} fill="currentColor" />}</button><div className="audio-caption"><span>{settings.audioCaptionLabel}</span><strong>{featuredProgram?.featureTitle ?? featuredProgram?.title}</strong><small>{featuredProgram?.featureSubtitle ?? featuredProgram?.subtitle}</small></div></div></div></div></section>

        <section className="services-section section-wrap section-space" id="services" aria-labelledby="services-heading"><div className="section-rail"><span>04</span><span>{settings.servicesRailLabel}</span></div><div className="section-heading-row services-heading"><div><p className="eyebrow">{settings.servicesEyebrow}</p><h2 id="services-heading">{settings.servicesTitle}<br /><em>{settings.servicesAccent}</em></h2></div><p className="section-summary">{settings.servicesSummary}</p></div><div className="services-grid">{decorServices.map((service, index) => <button className="service-card" type="button" key={service.title} onClick={() => onPlaceholder(service.title)}><div className="service-image"><img src={service.image} alt={service.label} /><span>{service.label}</span></div><span className="service-top"><span>{String.fromCharCode(65 + index)}</span><Sparkles size={20} /></span><h3>{service.title}</h3><p>{service.description}</p><span className="service-link">Explore <ArrowUpRight size={16} /></span></button>)}</div></section>

        <section className="event-section section-wrap section-space" aria-labelledby="event-heading"><div className="event-image"><img src={settings.eventImageUrl} alt={settings.eventImageLabel} /><span className="image-label image-label-dark">{settings.eventImageLabel}</span></div><div className="event-copy"><p className="eyebrow">{settings.eventEyebrow}</p><h2 id="event-heading">{settings.eventTitle}<br /><em>{settings.eventAccent}</em></h2><p className="body-large">{settings.eventBody}</p><button className="button button-outline" type="button" onClick={() => scrollToId("contact")}>{settings.eventCtaLabel} <ArrowUpRight size={17} /></button></div></section>

        <section className="journal-section section-space" id="journal" aria-labelledby="journal-heading"><div className="section-wrap"><div className="section-rail"><span>05</span><span>{settings.journalRailLabel}</span></div><div className="section-heading-row"><div><p className="eyebrow">{settings.journalEyebrow}</p><h2 id="journal-heading">{settings.journalTitle}<br /><em>{settings.journalAccent}</em></h2></div><button className="text-link" type="button" onClick={() => onPlaceholder(settings.journalRailLabel)}>{copy.viewNotes} <ArrowRight size={16} /></button></div><div className="journal-list">{journalEntries.map((note: any) => <button type="button" className="journal-row" key={note.id} onClick={() => onPlaceholder(note.title)}><span className="journal-date">{note.dateLabel}</span><strong>{note.title}</strong><span className="journal-kind">{note.category}</span><ArrowUpRight size={18} /></button>)}</div></div></section>

        <section className="contact-section section-wrap section-space" id="contact" aria-labelledby="contact-heading"><div className="section-rail section-rail-dark"><span>06</span><span>{settings.contactRailLabel}</span></div><div className="contact-grid"><div className="contact-copy"><p className="eyebrow eyebrow-light">{settings.contactEyebrow}</p><h2 id="contact-heading">{settings.contactTitle}<br /><em>{settings.contactAccent}</em></h2><p>{settings.contactBody}</p><div className="contact-details"><span><Mail size={15} /> {settings.contactEmail}</span><span><MapPin size={15} /> {settings.contactLocation}</span></div></div><form className="contact-form" onSubmit={handleSubmit}><label>{copy.name}<input name="name" required placeholder={copy.placeholderName} /></label><label>{copy.email}<input name="email" type="email" required placeholder={copy.placeholderEmail} /></label><label>{copy.brief}<textarea name="brief" required placeholder={copy.placeholderBrief} rows={3} /></label><button className="button button-signal button-submit" type="submit" disabled={submitInquiry.isPending}>{submitInquiry.isPending ? "Sending…" : copy.send} <Send size={16} /></button></form></div></section>
      </main>

      <footer className="site-footer section-wrap"><div className="footer-brand"><a className="brand" href="#top"><img src={asset.mark} alt="" className="brand-mark" /><span className="brand-wordmark"><strong>{settings.siteName}</strong><span>{settings.brandLine}</span></span></a><p>{settings.heroTitle}<br />{settings.heroAccent}</p></div><div className="footer-links"><div><span className="footer-label">{settings.footerNavigateLabel}</span><a href="#about">{copy.about}</a><a href="#programs">{copy.programs}</a><a href="#services">{copy.services}</a><a href="#journal">{copy.journal}</a></div><div><span className="footer-label">{settings.footerFollowLabel}</span><a href={settings.instagramUrl} target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a><a href={settings.youtubeUrl} target="_blank" rel="noreferrer"><Youtube size={16} /> YouTube</a><a href={settings.facebookUrl} target="_blank" rel="noreferrer"><Facebook size={16} /> Facebook</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {settings.siteName} {settings.brandLine}</span><span>{settings.footerBuiltLine}</span></div></footer>
    </div>
  );
}
