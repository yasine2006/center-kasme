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
  Globe2,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  MessageCircle,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

interface SessionInfo {
  name: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
}

interface LandingPageProps {
  session: SessionInfo | null;
  dashboardUrl: string | null;
}

const languages = [
  { flag: "🇬🇧", name: "Anglais", detail: "Développez votre anglais au quotidien." },
  { flag: "🇫🇷", name: "Français", detail: "Progressez à l’oral et à l’écrit." },
  { flag: "🇩🇪", name: "Allemand", detail: "Découvrez une nouvelle langue." },
  { flag: "🇪🇸", name: "Espagnol", detail: "Communiquez avec confiance." },
  { flag: "🇮🇹", name: "Italien", detail: "Apprenez à votre rythme." },
];

const exams = [
  { name: "IELTS", desc: "Études & immigration anglophone" },
  { name: "TOEFL", desc: "Reconnaissance académique internationale" },
  { name: "TCF", desc: "Certification officielle de français" },
  { name: "DELF", desc: "Diplôme d'études en langue française" },
];

function Brand() {
  return (
    <Link href="#accueil" className="flex items-center gap-3 shrink-0 group" aria-label="The Elite Centre - Accueil">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400 bg-gradient-to-br from-navy-900 to-navy-950 text-amber-400 shadow-md shadow-navy-950/40 transition-transform duration-200 group-hover:scale-105">
        <BookOpen className="h-6 w-6" />
        <span className="absolute -top-1.5 -right-1 text-amber-400 text-xs">★</span>
      </div>
      <div className="leading-tight">
        <div className="font-['Playfair_Display',serif] text-white text-lg sm:text-xl font-bold tracking-tight">
          The Elite Centre
        </div>
        <div className="text-blue-200 text-[10px] sm:text-xs tracking-wide">
          of Languages and Communication
        </div>
        <div className="text-amber-400 text-[11px] font-semibold italic">Khénifra</div>
      </div>
    </Link>
  );
}

export function LandingPage({ session, dashboardUrl }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    ["Accueil", "#accueil"],
    ["À propos", "#apropos"],
    ["Formations", "#formations"],
    ["Examens", "#examens"],
    ["Tarifs", "#tarifs"],
    ["Contact", "#contact"],
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-amber-400 selection:text-navy-950 font-['DM_Sans',sans-serif]">
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-50 bg-[#061d46]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-navy-950/20">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between gap-6">
          <Brand />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {nav.map(([label, href], i) => (
              <a
                key={label}
                href={href}
                className={`text-sm font-semibold transition-colors duration-200 ${
                  i === 0 ? "text-amber-400 font-bold" : "text-blue-100 hover:text-amber-300"
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* User action button */}
          <div className="hidden lg:flex items-center gap-3">
            {session && dashboardUrl ? (
              <Link
                href={dashboardUrl}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 px-5 py-2.5 font-bold text-sm shadow-md shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Mon Espace ({session.role.toLowerCase()})</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 px-5 py-2.5 font-bold text-sm shadow-md shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Espace Élève</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Ouvrir le menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="lg:hidden bg-[#061d46] border-t border-white/10 px-5 py-4 flex flex-col gap-3 shadow-2xl">
            {nav.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={closeMenu}
                className="text-white hover:text-amber-400 py-2 text-sm font-medium border-b border-white/5 transition-colors"
              >
                {label}
              </a>
            ))}

            {session && dashboardUrl ? (
              <Link
                href={dashboardUrl}
                onClick={closeMenu}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 text-navy-950 px-4 py-3 font-bold text-sm shadow-lg shadow-amber-500/20"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Accéder à mon espace</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={closeMenu}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 text-navy-950 px-4 py-3 font-bold text-sm shadow-lg shadow-amber-500/20"
              >
                <GraduationCap className="h-4 w-4" />
                <span>Espace Élève / Connexion</span>
              </Link>
            )}
          </div>
        )}
      </header>

      <main>
        {/* ── HERO SECTION ── */}
        <section id="accueil" className="relative overflow-hidden bg-[#08295f] text-white">
          {/* Background image & gradient overlay */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-30 md:opacity-40 mix-blend-luminosity"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1800&q=90')",
            }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#061d46] via-[#08295f]/95 to-[#08295f]/70" />

          <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10 min-h-[580px] lg:min-h-[640px] flex items-center py-16 lg:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-400/30 px-4 py-1.5 text-amber-300 text-sm font-medium mb-6 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="font-['Playfair_Display',serif] italic">
                  Apprenez aujourd’hui, créez vos opportunités demain !
                </span>
              </div>

              <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                The Elite Centre{" "}
                <span className="block text-amber-400 mt-2 text-3xl sm:text-4xl lg:text-5xl">
                  of Languages and Communication
                </span>
              </h1>

              <p className="text-blue-100 text-base sm:text-lg leading-relaxed mt-6 max-w-xl font-light">
                Centre d’élite pour l’apprentissage des langues et de la communication à Khénifra. Des
                formations d&apos;excellence adaptées à tous les niveaux, encadrées par des professeurs qualifiés.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 mt-8">
                <a
                  href="#formations"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-navy-950 px-6 py-3.5 font-extrabold text-sm shadow-xl shadow-amber-400/25 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <GraduationCap className="h-5 w-5" />
                  <span>Découvrir nos formations</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                {session && dashboardUrl ? (
                  <Link
                    href={dashboardUrl}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/80 text-amber-300 hover:bg-white/10 px-6 py-3.5 font-bold text-sm backdrop-blur-sm transition-all duration-200"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Tableau de bord</span>
                  </Link>
                ) : (
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/80 text-amber-300 hover:bg-white/10 px-6 py-3.5 font-bold text-sm backdrop-blur-sm transition-all duration-200"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Nous contacter</span>
                  </a>
                )}
              </div>

              {/* Checklist */}
              <div className="flex flex-wrap gap-x-6 gap-y-2.5 mt-10 text-blue-100 text-sm font-medium">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" /> Tous niveaux
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" /> Enfants & Adultes
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" /> Inscriptions ouvertes
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── QUICK STRIP ── */}
        <section className="max-w-7xl mx-auto px-5 lg:px-8 -mt-8 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center gap-4 shadow-xl shadow-slate-900/5 transition-transform duration-200 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <b className="block text-navy-950 text-sm font-bold">Pour tous les âges</b>
                <span className="block text-slate-500 text-xs mt-0.5">Jeunes, étudiants et adultes</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center gap-4 shadow-xl shadow-slate-900/5 transition-transform duration-200 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <b className="block text-navy-950 text-sm font-bold">Encadrement qualifié</b>
                <span className="block text-slate-500 text-xs mt-0.5">Équipe pédagogique engagée</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 flex items-center gap-4 shadow-xl shadow-slate-900/5 transition-transform duration-200 hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <b className="block text-navy-950 text-sm font-bold">4 compétences clés</b>
                <span className="block text-slate-500 text-xs mt-0.5">Parler, écouter, lire, écrire</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── À PROPOS SECTION ── */}
        <section id="apropos" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="w-full h-[360px] sm:h-[420px] object-cover rounded-3xl shadow-2xl border-4 border-white ring-8 ring-amber-400/20"
                src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1100&q=85"
                alt="Espace d’apprentissage The Elite Centre"
              />
              <div className="absolute -bottom-5 left-6 bg-[#061d46] text-white px-6 py-4 rounded-2xl shadow-xl border border-white/10 flex items-center gap-4">
                <span className="font-['Playfair_Display',serif] text-3xl font-bold text-amber-400">Elite</span>
                <div className="border-l border-white/20 pl-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Centre d&apos;excellence</p>
                  <p className="text-xs text-slate-300">Apprendre avec ambition</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-amber-600 font-extrabold uppercase tracking-widest text-xs">
                Bienvenue chez The Elite Centre
              </p>
              <h2 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-bold text-navy-950 leading-tight mt-3">
                Donnez une nouvelle dimension à votre apprentissage.
              </h2>
              <p className="text-slate-600 leading-relaxed mt-5 text-base">
                Situé au cœur de Khénifra, <strong>The Elite Centre of Languages and Communication</strong> accompagne les
                élèves, étudiants et professionnels dans le perfectionnement de leurs compétences linguistiques grâce à des
                méthodes pédagogiques modernes, interactives et personnalisées.
              </p>
              <p className="text-slate-600 leading-relaxed mt-4 text-base">
                Que vous débutiez une nouvelle langue ou prépariez un examen international pour vos études ou votre carrière,
                notre équipe vous donne les clés pour réussir avec confiance.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-bold text-sm group"
                >
                  <span>En savoir plus sur nos programmes</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FORMATIONS SECTION ── */}
        <section id="formations" className="py-24 bg-slate-50 border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-amber-600 font-extrabold uppercase tracking-widest text-xs">Nos Formations</p>
              <h2 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-bold text-navy-950 leading-tight mt-2">
                Choisissez la langue qui ouvre vos horizons.
              </h2>
              <p className="text-slate-600 mt-4 leading-relaxed text-sm sm:text-base">
                Des programmes évolutifs du niveau débutant au niveau perfectionnement, adaptés à vos objectifs personnels ou
                académiques.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-14">
              {languages.map((lang) => (
                <article
                  key={lang.name}
                  className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center shadow-lg shadow-slate-900/5 hover:border-amber-400 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-5xl mb-4 select-none">{lang.flag}</div>
                    <h3 className="text-lg font-bold text-navy-950 mb-2">{lang.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{lang.detail}</p>
                  </div>
                  <a
                    href="#contact"
                    className="mt-6 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 hover:text-amber-600 transition-colors pt-3 border-t border-slate-100"
                  >
                    <span>Détails & inscription</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CERTIFICATIONS & EXAMENS ── */}
        <section id="examens" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-amber-600 font-extrabold uppercase tracking-widest text-xs">Certifications Internationales</p>
              <h2 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-bold text-navy-950 leading-tight mt-2">
                Préparez vos examens officiels avec confiance.
              </h2>
              <p className="text-slate-600 mt-4 leading-relaxed text-sm sm:text-base">
                Un entraînement rigoureux avec examens blancs, simulations orales et analyse des grilles d&apos;évaluation.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
              {exams.map((exam, i) => (
                <div
                  key={exam.name}
                  className="border border-slate-200 rounded-2xl p-6 text-center shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                      Préparation
                    </span>
                    <strong
                      className={`block font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold tracking-tight ${
                        i === 0 ? "text-red-600" : "text-navy-900"
                      }`}
                    >
                      {exam.name}
                    </strong>
                    <p className="text-xs text-slate-500 mt-3 leading-relaxed">{exam.desc}</p>
                  </div>
                  <a
                    href="#contact"
                    className="mt-6 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Demander des informations
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BENEFITS STRIP ── */}
        <section className="bg-[#061d46] py-20 text-white">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-400 flex items-center justify-center mb-5">
                  <Award className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-base">Professeurs qualifiés</h3>
                <p className="text-blue-200 text-xs mt-2 max-w-xs leading-relaxed">
                  Un accompagnement pédagogique structuré et bienveillant.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-400 flex items-center justify-center mb-5">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-base">Programmes modernes</h3>
                <p className="text-blue-200 text-xs mt-2 max-w-xs leading-relaxed">
                  Des manuels et des supports adaptés aux standards européens.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-400 flex items-center justify-center mb-5">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-base">Tous les niveaux</h3>
                <p className="text-blue-200 text-xs mt-2 max-w-xs leading-relaxed">
                  Classes homogènes, du débutant absolu au niveau avancé.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl border border-amber-400/40 bg-amber-400/10 text-amber-400 flex items-center justify-center mb-5">
                  <Globe2 className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-base">Compétences complètes</h3>
                <p className="text-blue-200 text-xs mt-2 max-w-xs leading-relaxed">
                  Équilibre rigoureux entre expression orale et maîtrise écrite.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── TARIFS & PERSONNALISATION ── */}
        <section id="tarifs" className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-5 text-center">
            <p className="text-amber-600 font-extrabold uppercase tracking-widest text-xs">Nos Tarifs</p>
            <h2 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-bold text-navy-950 leading-tight mt-2">
              Une formation adaptée à votre budget et à vos objectifs.
            </h2>
            <p className="text-slate-600 mt-5 leading-relaxed text-sm sm:text-base">
              Nos tarifs sont calculés selon la langue choisie, le volume horaire hebdomadaire et le type de formation
              (cours collectifs, cours intensifs ou préparation aux concours). Contactez notre secrétariat pour obtenir
              un devis clair et choisir votre créneau.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/212642539608?text=Bonjour%2C%20je%20souhaite%20avoir%20des%20informations%20sur%20les%20tarifs%20et%20formations."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-3.5 font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Demander les tarifs sur WhatsApp</span>
              </a>
              <a
                href="tel:+212642539608"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-800 px-6 py-3.5 font-bold text-sm transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>0642-539608</span>
              </a>
            </div>
          </div>
        </section>

        {/* ── ENROLLMENT BANNER ── */}
        <section className="bg-gradient-to-r from-[#061d46] to-[#0d3d88] border-y-4 border-amber-400 py-12 text-white">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-amber-400 font-extrabold tracking-wider text-xs uppercase">Inscriptions Ouvertes</p>
              <h2 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl font-bold mt-1 text-white">
                Votre prochain chapitre linguistique commence ici.
              </h2>
              <p className="text-blue-100 text-sm mt-1 font-light">
                Les places dans les groupes sont limitées pour garantir la qualité de l&apos;encadrement.
              </p>
            </div>
            <a
              href="https://wa.me/212642539608"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-navy-950 px-6 py-3.5 font-extrabold text-sm whitespace-nowrap shadow-xl shadow-amber-400/20 transition-transform hover:scale-105"
            >
              <MessageCircle className="h-5 w-5" />
              <span>S’inscrire / Nous contacter</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* ── CONTACT & MAP ── */}
        <section id="contact" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-5 lg:px-8">
            <div className="text-center max-w-xl mx-auto">
              <p className="text-amber-600 font-extrabold uppercase tracking-widest text-xs">Contact & Accès</p>
              <h2 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-bold text-navy-950 leading-tight mt-2">
                Nous sommes à votre écoute.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
              <a
                href="tel:+212642539608"
                className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 text-blue-700 hover:border-amber-400 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <b className="block text-navy-950 text-sm font-bold">Téléphone</b>
                  <small className="block text-slate-500 text-xs mt-0.5">0642-539608</small>
                </div>
              </a>

              <a
                href="mailto:elitekacemcenter@gmail.com"
                className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 text-blue-700 hover:border-amber-400 hover:shadow-lg transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <b className="block text-navy-950 text-sm font-bold">Email</b>
                  <small className="block text-slate-500 text-xs mt-0.5 break-all">elitekacemcenter@gmail.com</small>
                </div>
              </a>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 text-blue-700">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <b className="block text-navy-950 text-sm font-bold">Adresse</b>
                  <small className="block text-slate-500 text-xs mt-0.5">
                    Boulevard Mohammed V, Dar Attalib, Appt N°4, Khénifra
                  </small>
                </div>
              </div>
            </div>

            {/* Google Maps embed */}
            <div className="mt-8 rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
              <iframe
                title="Localisation de The Elite Centre à Khénifra"
                src="https://www.google.com/maps?q=Dar%20Attalib%2C%20Boulevard%20Mohammed%20V%2C%20Khenifra%2C%20Morocco&output=embed"
                width="100%"
                height="320"
                style={{ border: 0 }}
                loading="lazy"
              />
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#061d46] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Brand />
            <p className="text-blue-200 text-xs mt-5 max-w-sm leading-relaxed">
              The Elite Centre of Languages and Communication — Khénifra.
              <br />
              Apprenez aujourd’hui, créez vos opportunités demain !
            </p>
          </div>

          <div className="flex flex-col gap-2.5 text-xs text-blue-100">
            <b className="text-white text-sm font-bold mb-2">Navigation</b>
            {nav.map(([label, href]) => (
              <a key={label} href={href} className="hover:text-amber-400 transition-colors">
                {label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 text-xs text-blue-100">
            <b className="text-white text-sm font-bold mb-2">Espace & Contact</b>
            <Link href="/login" className="text-amber-300 hover:text-amber-200 font-bold">
              Espace Élève / Administration →
            </Link>
            <a href="tel:+212642539608" className="hover:text-amber-400 transition-colors">
              Tél : 0642-539608
            </a>
            <a href="mailto:elitekacemcenter@gmail.com" className="hover:text-amber-400 transition-colors">
              elitekacemcenter@gmail.com
            </a>
            <span className="text-slate-400 mt-1">Boulevard Mohammed V, Dar Attalib, Appt N°4, Khénifra</span>
          </div>
        </div>

        <div className="border-t border-white/10 text-center text-blue-300 text-xs py-6">
          © {new Date().getFullYear()} The Elite Centre of Languages and Communication — Khénifra. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
