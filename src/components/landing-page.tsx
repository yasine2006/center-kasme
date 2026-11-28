"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  GraduationCap,
  ArrowRight,
  Phone,
  MapPin,
  Mail,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  MessageCircle,
  LayoutDashboard,
  Sparkles,
  Star,
  Clock,
  Compass,
  Check,
  ChevronDown,
  ShieldCheck,
  TrendingUp,
  Languages,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { getInitials, sanitizePhoneForWhatsApp, telHref } from "@/lib/contact";

interface SchoolInfo {
  name: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

interface SessionInfo {
  name: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

interface LandingPageProps {
  school: SchoolInfo | null;
  session: SessionInfo | null;
  dashboardUrl: string | null;
}

const languages = [
  {
    flag: "🇬🇧",
    name: "Anglais",
    tagline: "Global Communication & Business",
    detail: "Parlez avec fluidité et préparez vos entretiens ou séjours à l'étranger.",
    levels: "A1 → C2",
    popular: true,
  },
  {
    flag: "🇫🇷",
    name: "Français",
    tagline: "Communication & Perfectionnement",
    detail: "Maîtrisez la grammaire, la rédaction et l'expression orale sans hésitation.",
    levels: "A1 → C1",
    popular: false,
  },
  {
    flag: "🇩🇪",
    name: "Allemand",
    tagline: "Carrière, Études & Ausbildungs",
    detail: "Acquérez les compétences indispensables pour vos démarches en Allemagne.",
    levels: "A1 → B2",
    popular: true,
  },
  {
    flag: "🇪🇸",
    name: "Espagnol",
    tagline: "Pratique Orale & Échanges",
    detail: "Apprenez l'une des langues les plus parlées au monde à travers des ateliers vivants.",
    levels: "A1 → B2",
    popular: false,
  },
  {
    flag: "🇮🇹",
    name: "Italien",
    tagline: "Culture & Expression",
    detail: "Découvrez la langue italienne à travers une méthode progressive et dynamique.",
    levels: "A1 → B2",
    popular: false,
  },
];

const certifications = [
  {
    name: "IELTS",
    target: "Band 6.5 → 8.5",
    color: "from-rose-500 to-red-600",
    desc: "Test officiel pour les universités anglophones (UK, Canada, Europe) et l'immigration.",
    features: ["Épreuves types chronométrées", "Simulations d'expression orale individuelles", "Stratégies de rédaction Task 1 & 2"],
  },
  {
    name: "TOEFL iBT",
    target: "Score 90 → 110+",
    color: "from-blue-600 to-indigo-700",
    desc: "Référence mondiale pour les admissions académiques internationales et les bourses.",
    features: ["Entraînement sur logiciel officiel", "Techniques d'écoute rapide", "Optimisation du score oral"],
  },
  {
    name: "TCF Canada / IRN",
    target: "Niveaux B2 / C1",
    color: "from-sky-500 to-blue-600",
    desc: "Test certifiant pour les démarches d'immigration au Canada et l'accès à la nationalité.",
    features: ["Compréhension orale intensive", "Expression écrite assistée", "Analyse des grilles de notation"],
  },
  {
    name: "DELF / DALF",
    target: "Diplôme à vie (A1-C1)",
    color: "from-emerald-500 to-teal-600",
    desc: "Diplôme d'État français délivré par le ministère de l'Éducation nationale.",
    features: ["Validité à vie", "Accès direct aux universités françaises", "Reconnaissance internationale"],
  },
];

const plans = [
  {
    title: "Formule Standard",
    badge: "Populaire",
    desc: "Idéal pour progresser régulièrement tout au long de l'année scolaire.",
    hours: "4h / semaine",
    points: [
      "Groupes réduits (8 à 12 élèves max)",
      "Supports pédagogiques inclus",
      "Évaluations continues & bulletin",
      "Accès à l'espace élève numérique",
    ],
    popular: false,
  },
  {
    title: "Formule Intensive",
    badge: "Progression rapide",
    desc: "Pour les personnes voulant maîtriser une langue en un temps record.",
    hours: "8h à 12h / semaine",
    points: [
      "Immersion orale quotidienne",
      "Ateliers d'expression & débat",
      "Correction personnalisée de la prononciation",
      "Bilan de niveau hebdomadaire",
    ],
    popular: true,
  },
  {
    title: "Préparation Examens",
    badge: "Objectif Réussite",
    desc: "Préparation sur mesure aux tests IELTS, TOEFL, TCF et DELF.",
    hours: "Programme ciblé",
    points: [
      "Examens blancs en conditions réelles",
      "Coaching individuel sur les points faibles",
      "Banque de sujets officiels récents",
      "Attestation de suivi de formation",
    ],
    popular: false,
  },
];

const faqs = [
  {
    q: "Comment puis-je connaître mon niveau avant de m'inscrire ?",
    a: "Nous effectuons un test de positionnement gratuit (écrit et oral) pour évaluer vos acquis et vous orienter vers le groupe qui correspond exactement à vos besoins.",
  },
  {
    q: "Quels sont les créneaux horaires disponibles ?",
    a: "Nous proposons des cours en semaine (matin, après-midi et cours en soirée après 18 h) ainsi que des sessions spéciales le samedi et le dimanche pour les élèves et professionnels.",
  },
  {
    q: "Obtient-on une attestation à la fin de la formation ?",
    a: "Oui, chaque apprenant ayant suivi sa session avec assiduité reçoit un certificat de niveau attestant des compétences acquises, en accord avec le cadre européen CECRL.",
  },
  {
    q: "Comment contacter le secrétariat pour s'inscrire ?",
    a: "Vous pouvez nous joindre directement par WhatsApp, téléphone ou nous rendre visite au centre pour finaliser votre dossier d'inscription.",
  },
];

export function LandingPage({ school, session, dashboardUrl }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const schoolName = school?.name?.trim() || "The Elite Centre of Languages and Communication";
  const schoolPhone = school?.phone?.trim() || "0642-539608";
  const schoolEmail = school?.email?.trim() || "elitekacemcenter@gmail.com";
  const schoolAddress =
    school?.address?.trim() || "Boulevard Mohammed V, Dar Attalib, Appt n° 4, Khénifra";
  const waNumber = sanitizePhoneForWhatsApp(schoolPhone);

  const nav = [
    ["Accueil", "#accueil"],
    ["À propos", "/a-propos"],
    ["Formations", "#formations"],
    ["Certifications", "#certifications"],
    ["Méthode", "#methode"],
    ["Formules", "#formules"],
    ["Contact", "#contact"],
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* ── TOP NOTIFICATION BAR ── */}
      <aside aria-label="Annonces" className="bg-navy-950 text-slate-300 text-xs py-2.5 px-4 border-b border-navy-800/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-semibold text-[11px] border border-brand-500/30">
              <Sparkles className="h-3 w-3" /> Inscriptions ouvertes 2026
            </span>
            <span className="text-slate-300 hidden md:inline">
              Nouveaux groupes d&apos;anglais, d&apos;allemand et de français, ainsi que des sessions de certification.
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <a href={telHref(schoolPhone)} className="hover:text-white flex items-center gap-1 transition-colors">
              <Phone className="h-3 w-3 text-brand-400" />
              <span>{schoolPhone}</span>
            </a>
            <span className="text-slate-700" aria-hidden="true">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <MapPin className="h-3 w-3 text-brand-400" />
              <span>Khénifra, Maroc</span>
            </span>
          </div>
        </div>
      </aside>

      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between gap-6">
          {/* Logo & School Name adaptable to Admin Settings */}
          <Link href="#accueil" className="flex items-center gap-3.5 shrink-0 group">
            {school?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={school.logo}
                alt={schoolName}
                className="h-12 w-12 rounded-xl object-contain border border-slate-200 bg-white p-1 shadow-sm transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-navy-950 via-navy-900 to-brand-700 text-white font-bold shadow-md shadow-brand-500/15 border border-navy-800 transition-transform duration-200 group-hover:scale-105">
                <span className="text-lg tracking-wider font-extrabold">{getInitials(schoolName)}</span>
              </div>
            )}
            <div className="leading-tight">
              <div className="font-bold text-navy-950 text-base sm:text-lg tracking-tight group-hover:text-brand-600 transition-colors line-clamp-1">
                {schoolName}
              </div>
              <div className="text-slate-500 text-[11px] sm:text-xs font-medium">
                Centre de langues et de communication
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {nav.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors duration-150"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* User Auth Action (Dashboard or Login) */}
          <div className="hidden lg:flex items-center gap-3.5">
            {session && dashboardUrl ? (
              <Link
                href={dashboardUrl}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-950 hover:bg-navy-900 text-white px-5 py-2.5 font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                <LayoutDashboard className="h-4 w-4 text-brand-400" />
                <span>Mon espace ({session.role.toLowerCase()})</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 font-semibold text-sm shadow-md shadow-brand-500/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Espace élève / Connexion</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="lg:hidden text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-5 py-5 flex flex-col gap-3 shadow-xl">
            {nav.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={closeMenu}
                className="text-slate-700 hover:text-brand-600 py-2 text-sm font-medium border-b border-slate-100 transition-colors"
              >
                {label}
              </a>
            ))}

            <div className="pt-2">
              {session && dashboardUrl ? (
                <Link
                  href={dashboardUrl}
                  onClick={closeMenu}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-navy-950 text-white px-4 py-3 font-semibold text-sm shadow-sm"
                >
                  <LayoutDashboard className="h-4 w-4 text-brand-400" />
                  <span>Accéder à mon espace ({session.name})</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 text-white px-4 py-3 font-semibold text-sm shadow-sm shadow-brand-500/20"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Espace élève / Connexion</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ── HERO SECTION: PREMIUM DARK SPLIT LAYOUT ── */}
        <section id="accueil" className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-elite-blue border-b border-navy-800">
          {/* Layered background mesh */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_-10%,rgba(20,85,189,0.35),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_10%_80%,rgba(234,185,67,0.08),transparent)]" />

          {/* Animated orbs */}
          <div className="pointer-events-none absolute top-16 right-16 w-72 h-72 rounded-full bg-brand-600/10 blur-3xl animate-float" />
          <div className="pointer-events-none absolute -bottom-10 left-8 w-56 h-56 rounded-full bg-elite-gold/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="pointer-events-none absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl animate-float" style={{ animationDelay: "3s" }} />

          {/* Grid texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 lg:py-24 relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">

              {/* ── LEFT: Content ── */}
              <div className="lg:col-span-7">

                {/* Top badge pill */}
                <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-1.5 text-elite-gold text-xs font-bold mb-7 animate-fade-up">
                  <Star className="h-3.5 w-3.5 fill-elite-gold text-elite-gold" />
                  <span>L&apos;excellence linguistique à Khénifra</span>
                  <span className="w-1 h-1 rounded-full bg-elite-gold/50" />
                  <span className="text-white/60">Depuis 2018</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-white tracking-tight leading-[1.1] animate-fade-up delay-100">
                  Développez vos{" "}
                  <span
                    className="relative inline-block"
                    style={{
                      background: "linear-gradient(135deg, #eab943 0%, #ffd875 50%, #eab943 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    compétences linguistiques.
                  </span>
                  <br />
                  <span className="text-white/85">Ouvrez vos horizons.</span>
                </h1>

                <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed animate-fade-up delay-200">
                  Bienvenue à{" "}
                  <span className="text-white font-semibold">{schoolName}</span>. Programmes immersifs en{" "}
                  <span className="text-elite-gold font-semibold">anglais, allemand, français, espagnol et italien</span>,
                  et préparation intensive aux certifications internationales.
                </p>

                {/* CTA Buttons */}
                <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 animate-fade-up delay-300">
                  <a
                    href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20souhaite%20avoir%20des%20informations%20sur%20les%20inscriptions%20et%20formations.`}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center justify-center gap-2.5 rounded-xl px-7 py-4 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-xl"
                    style={{
                      background: "linear-gradient(135deg, #eab943, #f5ca5c)",
                      color: "#08295f",
                      boxShadow: "0 8px 24px -4px rgba(234,185,67,0.45)",
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>S&apos;inscrire via WhatsApp</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>

                  <a
                    href="#formations"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/20 text-white px-7 py-4 font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <BookOpen className="h-4 w-4 text-white/70" />
                    <span>Voir nos formations</span>
                  </a>
                </div>

                {/* KPI Stats — 3 pills */}
                <div className="mt-11 pt-8 border-t border-white/10 grid grid-cols-3 gap-5 animate-fade-up delay-400">
                  {[
                    { value: "98%", label: "Taux de réussite", icon: TrendingUp },
                    { value: "+1 200", label: "Apprenants formés", icon: Users },
                    { value: "100%", label: "Formateurs qualifiés", icon: Award },
                  ].map(({ value, label, icon: Icon }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-4 w-4 text-elite-gold shrink-0" />
                        <span className="text-2xl sm:text-3xl font-extrabold text-white leading-none">{value}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Trust logos row — language flags */}
                <div className="mt-8 flex items-center gap-3 flex-wrap animate-fade-up delay-500">
                  <span className="text-[11px] text-slate-500 font-medium mr-1">Langues :</span>
                  {[
                    { flag: "🇬🇧", name: "Anglais" },
                    { flag: "🇫🇷", name: "Français" },
                    { flag: "🇩🇪", name: "Allemand" },
                    { flag: "🇪🇸", name: "Espagnol" },
                    { flag: "🇮🇹", name: "Italien" },
                  ].map(({ flag, name }) => (
                    <span
                      key={flag}
                      aria-label={name}
                      className="text-xl select-none bg-white/8 hover:bg-white/14 rounded-lg px-2.5 py-1.5 transition-colors cursor-default border border-white/10"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── RIGHT: Image card ── */}
              <div className="lg:col-span-5 relative animate-fade-right delay-200">
                <div className="relative mx-auto max-w-md lg:max-w-none">

                  {/* Glow halo behind image */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-elite-gold/20 via-brand-500/20 to-indigo-500/15 rounded-[2rem] blur-2xl" />

                  {/* Image container */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-float">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/hero.jpg"
                      alt="Étudiants collaborant activement au centre"
                      className="w-full h-[400px] sm:h-[500px] object-cover object-center"
                    />

                    {/* Gradient overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-950/80 to-transparent" />

                    {/* Bottom glass card */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Sessions interactives</div>
                          <div className="text-[11px] text-white/60">Pratique orale quotidienne</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-elite-gold bg-elite-gold/15 border border-elite-gold/30 px-2.5 py-1 rounded-full">
                        Tous âges
                      </span>
                    </div>
                  </div>

                  {/* Top-right floating badge */}
                  <div className="absolute -top-5 -right-3 sm:-right-6 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 border border-elite-gold/30 animate-scale-in"
                    style={{ background: "linear-gradient(135deg, #08295f, #0b2d6e)" }}>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold"
                      style={{ background: "linear-gradient(135deg, #eab943, #f5ca5c)" }}>
                      <Award className="h-5 w-5 text-navy-950" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Centre d&apos;élite</div>
                      <div className="text-[11px] text-slate-300">Certifié et agréé</div>
                    </div>
                  </div>

                  {/* Left floating mini-badge */}
                  <div className="absolute -left-5 top-1/2 -translate-y-1/2 bg-brand-600 text-white rounded-xl px-3 py-2 shadow-lg border border-brand-500/50 flex items-center gap-2 animate-fade-left delay-300">
                    <GraduationCap className="h-4 w-4" />
                    <span className="text-[11px] font-bold whitespace-nowrap">5 langues</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* ── BENTO HIGHLIGHTS: CORE ADVANTAGES ── */}
        <section className="py-20 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Pourquoi nous choisir</span>
              <h2 className="text-3xl font-extrabold text-navy-950 tracking-tight mt-2">
                Un environnement pensé pour votre progression
              </h2>
              <p className="text-slate-600 mt-3 text-sm sm:text-base">
                Notre pédagogie active place la communication réelle et la confiance en soi au centre de chaque séance.
              </p>
            </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:border-brand-300 hover:shadow-md transition-all duration-200">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mb-5">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Effectifs réduits</h3>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                  De 8 à 12 élèves par groupe pour assurer un temps de parole optimal à chacun et un suivi personnalisé.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:border-brand-300 hover:shadow-md transition-all duration-200">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Méthode communicative</h3>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Travail équilibré sur les 4 compétences : écoute, prise de parole, lecture et rédaction structurée.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:border-brand-300 hover:shadow-md transition-all duration-200">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Flexibilité des horaires</h3>
                <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Créneaux en matinée, en après-midi, en soirée ou le week-end selon vos contraintes d&apos;emploi du temps.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FORMATIONS / CATALOGUE DES LANGUES ── */}
        <section id="formations" className="py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <Reveal>
              <div>
                <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Catalogue pédagogique</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight mt-2">
                  Formations linguistiques certifiées
                </h2>
                <p className="text-slate-600 mt-2 text-sm sm:text-base max-w-xl">
                  Du niveau débutant aux niveaux avancés, nos cursus sont structurés selon le cadre CECRL.
                </p>
              </div>
              </Reveal>
              <a
                href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20souhaite%20faire%20un%20test%20de%20niveau%20gratuit.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700"
              >
                <span>Faire un test de niveau gratuit</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {languages.map((item) => (
                <div
                  key={item.name}
                  className="group relative bg-slate-50 hover:bg-white rounded-2xl p-7 border border-slate-200 hover:border-brand-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl select-none">{item.flag}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                        {item.levels}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-navy-950 group-hover:text-brand-600 transition-colors">
                      {item.name}
                    </h3>
                    <div className="text-xs font-semibold text-brand-600 mt-1">{item.tagline}</div>
                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">{item.detail}</p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Cours enfants et adultes</span>
                    <a
                      href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20souhaite%20m'inscrire%20au%20cours%20de%20${encodeURIComponent(
                        item.name
                      )}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-950 group-hover:text-brand-600 transition-colors"
                    >
                      <span>S&apos;inscrire</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}

              {/* Special Custom Coaching Card */}
              <div className="bg-gradient-to-br from-navy-950 to-navy-900 text-white rounded-2xl p-7 border border-navy-800 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold mb-4">
                    <Languages className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Cours particuliers individuels</h3>
                  <div className="text-xs font-medium text-brand-300 mt-1">Coaching VIP sur mesure</div>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    Un formateur dédié pour cibler précisément vos besoins : préparation aux entretiens, rédaction de thèses
                    ou communication professionnelle urgente.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10">
                  <a
                    href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20souhaite%20des%20informations%20sur%20les%20cours%20particuliers.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white py-2.5 text-xs font-bold transition-colors"
                  >
                    <span>Demander un devis VIP</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CERTIFICATIONS & EXAMENS OFFICIELS ── */}
        <section id="certifications" className="py-24 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Examens et certifications</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight mt-2">
                Passez vos examens internationaux avec sérénité
              </h2>
              <p className="text-slate-600 mt-3 text-sm sm:text-base">
                Un accompagnement méthodologique calibré pour valider le score exact dont vous avez besoin pour vos projets.
              </p>
            </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {certifications.map((item) => (
                <div
                  key={item.name}
                  className="bg-white rounded-2xl p-7 border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-black text-navy-950 tracking-tight">{item.name}</span>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                        {item.target}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-5">{item.desc}</p>

                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      {item.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-xs text-slate-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <a
                      href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20souhaite%20préparer%20l'examen%20${encodeURIComponent(
                        item.name
                      )}.`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white py-3 text-xs font-bold transition-colors"
                    >
                      <span>Rejoindre la session de préparation</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION MÉTHODE & CADRE DE TRAVAIL (CLEAR PHOTOS) ── */}
        <section id="methode" className="py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Pédagogie et cadre</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight mt-2">
                  Un encadrement d&apos;élite adapté à chaque génération
                </h2>
                <p className="text-slate-600 mt-4 leading-relaxed text-sm sm:text-base">
                  À <strong>{schoolName}</strong>, nous croyons qu&apos;une langue vivante ne s&apos;apprend pas par cœur
                  dans un manuel théorique, mais se pratique activement au quotidien.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-1">
                      <Compass className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-950 text-base">Test de positionnement précis</h3>
                      <p className="text-slate-600 text-sm mt-1">
                        Chaque nouvel arrivant passe une évaluation écrite et orale pour intégrer un groupe de son niveau exact.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-1">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-950 text-base">Suivi numérique et présences</h3>
                      <p className="text-slate-600 text-sm mt-1">
                        Les parents et étudiants accèdent à leur espace élève pour consulter l&apos;assiduité, les emplois du
                        temps et les reçus de paiement en temps réel.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 mt-1">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-950 text-base">Certificat de fin de cycle</h3>
                      <p className="text-slate-600 text-sm mt-1">
                        Validation officielle des compétences avec attestation détaillée selon le standard européen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crisp Two-Image Composition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/salle.jpg"
                    alt="Salle de formation moderne"
                    className="w-full h-56 sm:h-64 rounded-2xl object-cover shadow-lg border border-slate-200"
                  />
                  <div className="bg-navy-950 text-white p-5 rounded-2xl shadow-lg border border-navy-800">
                    <div className="text-2xl font-extrabold text-brand-400">Khénifra</div>
                    <div className="text-xs text-slate-300 mt-1 font-medium">Boulevard Mohammed V</div>
                  </div>
                </div>

                <div className="space-y-4 pt-6">
                  <div className="bg-brand-600 text-white p-5 rounded-2xl shadow-lg">
                    <div className="text-2xl font-extrabold">100%</div>
                    <div className="text-xs text-blue-100 mt-1">Interactif et pratique</div>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/cours.jpg"
                    alt="Professeur et élèves en cours d'anglais"
                    className="w-full h-56 sm:h-64 rounded-2xl object-cover shadow-lg border border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FORMULES & TARIFS TRANSPARENTS ── */}
        <section id="formules" className="py-24 bg-slate-50 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Formules de cours</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight mt-2">
                Des formules conçues pour chaque rythme
              </h2>
              <p className="text-slate-600 mt-3 text-sm sm:text-base">
                Des formules adaptées à vos objectifs. Contactez-nous pour connaître le tarif exact de votre session.
              </p>
            </div>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {plans.map((p) => (
                <div
                  key={p.title}
                  className={`rounded-2xl p-8 border flex flex-col justify-between transition-all duration-200 ${
                    p.popular
                      ? "bg-white border-brand-500 shadow-xl ring-2 ring-brand-500/20 lg:-translate-y-2"
                      : "bg-white border-slate-200 shadow-xs hover:shadow-md"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          p.popular ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.badge}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{p.hours}</span>
                    </div>

                    <h3 className="text-2xl font-bold text-navy-950">{p.title}</h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{p.desc}</p>

                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                      {p.points.map((pt) => (
                        <div key={pt} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <a
                      href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20souhaite%20connaître%20le%20tarif%20pour%20la%20${encodeURIComponent(
                        p.title
                      )}.`}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                        p.popular
                          ? "bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20"
                          : "bg-navy-950 hover:bg-slate-800 text-white"
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Demander le tarif</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ── */}
        <section className="py-24 bg-white border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-5 lg:px-8">
            <Reveal>
            <div className="text-center mb-12">
              <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Questions fréquentes</span>
              <h2 className="text-3xl font-extrabold text-navy-950 tracking-tight mt-2">
                Tout ce que vous devez savoir
              </h2>
            </div>
            </Reveal>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${idx}`}
                      className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-navy-950 text-base hover:text-brand-600 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-brand-600" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={`faq-panel-${idx}`}
                        className="px-5 sm:px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4"
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CONTACT & LOCATION (DYNAMIC FROM DB) ── */}
        <section id="contact" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <Reveal>
            <div className="text-center max-w-xl mx-auto mb-14">
              <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Contact et accès</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight mt-2">
                Venez nous rencontrer
              </h2>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Notre secrétariat est à votre disposition pour toute information ou pour planifier votre test de niveau.
              </p>
            </div>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
              <a
                href={telHref(schoolPhone)}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 hover:border-brand-500 hover:shadow-md transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Téléphone</div>
                  <div className="text-base font-bold text-navy-950 mt-0.5">{schoolPhone}</div>
                </div>
              </a>

              <a
                href={`mailto:${schoolEmail}`}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 hover:border-brand-500 hover:shadow-md transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Courriel</div>
                  <div className="text-base font-bold text-navy-950 mt-0.5 truncate">{schoolEmail}</div>
                </div>
              </a>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Adresse</div>
                  <div className="text-sm font-bold text-navy-950 mt-0.5 leading-snug">{schoolAddress}</div>
                </div>
              </div>
            </div>

            {/* Social media */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <a
                href="https://www.facebook.com/TheEliteCentreofLanguagesandCommunication?locale=fr_FR"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-sm font-bold transition-colors shadow-md shadow-blue-600/20"
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span>Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/elitekacemcenter?utm_source=ig_web_button_share_sheet&evlk=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-5 py-3 text-sm font-bold transition-all shadow-md shadow-pink-500/20"
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                <span>Instagram</span>
              </a>
            </div>

            {/* Embedded Google Map */}
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white">
              <iframe
                title={`Localisation de ${schoolName}`}
                src="https://www.google.com/maps?q=Center%20Elite%20Kacem%2C%20Kh%C3%A9nifra&z=16&output=embed"
                width="100%"
                height="360"
                style={{ border: 0 }}
                loading="lazy"
              />
              <a
                href="https://maps.app.goo.gl/kY6cfhaM5ixrh1FE9"
                target="_blank"
                rel="noreferrer"
                className="mx-5 mb-5 mt-1 inline-flex items-center gap-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>Obtenir l&apos;itinéraire</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER: ELEGANT & ADAPTABLE ── */}
      <footer className="bg-navy-950 text-white border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: School Identity */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              {school?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={school.logo} alt={schoolName} className="h-11 w-11 rounded-xl object-contain bg-white p-1" />
              ) : (
                <div className="h-11 w-11 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white text-base">
                  {getInitials(schoolName)}
                </div>
              )}
              <div>
                <div className="text-lg font-bold text-white">{schoolName}</div>
                <div className="text-xs text-slate-400">Centre de langues et de communication</div>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm mt-4 max-w-md leading-relaxed">
              Formations certifiantes en langues vivantes et préparation aux examens internationaux à Khénifra.
              Rejoignez une communauté engagée vers l&apos;excellence académique et professionnelle.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href={`https://wa.me/${waNumber}?text=Bonjour%2C%20je%20souhaite%20avoir%20des%20informations%20sur%20les%20formations%20et%20les%20inscriptions.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Discussion WhatsApp</span>
              </a>
              <a
                href={telHref(schoolPhone)}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-900 hover:bg-navy-800 text-slate-200 border border-navy-800 px-4 py-2 text-xs font-bold transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{schoolPhone}</span>
              </a>
              <a
                href="https://www.facebook.com/TheEliteCentreofLanguagesandCommunication?locale=fr_FR"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold transition-colors"
              >
                <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span>Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/elitekacemcenter?utm_source=ig_web_button_share_sheet&evlk=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 text-xs font-bold transition-all"
              >
                <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="flex flex-col gap-2.5 text-xs text-slate-400">
            <div className="text-white text-sm font-bold mb-2">Navigation rapide</div>
            {nav.map(([label, href]) => (
              <a key={label} href={href} className="hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* Col 3: Portal & Administrative Access */}
          <div className="flex flex-col gap-2.5 text-xs text-slate-400">
            <div className="text-white text-sm font-bold mb-2">Accès et plateforme</div>
            <Link href="/login" className="text-brand-400 hover:text-brand-300 font-bold transition-colors">
              Espace élève / Connexion →
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Espace enseignant
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Portail administration
            </Link>
            <span className="text-slate-500 text-[11px] mt-2 block">{schoolAddress}</span>
          </div>
        </div>

        <div className="border-t border-navy-900 text-center text-slate-500 text-xs py-6">
          © {new Date().getFullYear()} {schoolName}. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
