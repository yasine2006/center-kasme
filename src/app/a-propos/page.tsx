import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { getInitials, sanitizePhoneForWhatsApp, telHref } from "@/lib/contact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "À propos du centre",
  description:
    "Découvrez The Elite Centre of Languages and Communication à Khénifra : formations en langues, certifications, méthode et coordonnées.",
  alternates: { canonical: "/a-propos" },
};

const languages = [
  ["Anglais", "Communication générale, affaires et préparation aux examens internationaux."],
  ["Français", "Grammaire, expression écrite et expression orale."],
  ["Allemand", "Parcours A1 à B2 pour les études et la carrière en Allemagne."],
  ["Espagnol", "Ateliers de conversation et pratique orale."],
  ["Italien", "Méthode progressive, de la découverte à l'expression."],
];

const certifications = [
  "IELTS",
  "TOEFL iBT",
  "TCF",
  "DELF / DALF",
];

export default async function AboutPage() {
  const school = await db.school
    .findFirst({
      select: { name: true, logo: true, address: true, phone: true, email: true },
    })
    .catch(() => null);

  const schoolName = school?.name?.trim() || "The Elite Centre of Languages and Communication";
  const schoolPhone = school?.phone?.trim() || "0642-539608";
  const schoolEmail = school?.email?.trim() || "elitekacemcenter@gmail.com";
  const schoolAddress =
    school?.address?.trim() || "Boulevard Mohammed V, Dar Attalib, Appt n° 4, Khénifra";
  const waNumber = sanitizePhoneForWhatsApp(schoolPhone);
  const whatsappHref = `https://wa.me/${waNumber}?text=Bonjour%2C%20je%20souhaite%20avoir%20des%20informations%20sur%20le%20centre%20et%20les%20inscriptions.`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3.5 shrink-0 group">
            {school?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={school.logo}
                alt={schoolName}
                className="h-12 w-12 rounded-xl object-contain border border-slate-200 bg-white p-1 shadow-sm"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-navy-950 via-navy-900 to-brand-700 text-white font-bold shadow-md border border-navy-800">
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

          <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-7">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">
              Accueil
            </Link>
            <Link href="/#formations" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">
              Formations
            </Link>
            <Link href="/#certifications" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">
              Certifications
            </Link>
            <Link href="/#contact" className="text-sm font-semibold text-slate-600 hover:text-brand-600 transition-colors">
              Contact
            </Link>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 font-semibold text-sm shadow-md shadow-brand-500/20 transition-all"
          >
            <GraduationCap className="h-4 w-4" />
            <span>Mon espace</span>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #eab943 0, transparent 45%), radial-gradient(circle at 85% 80%, #2563eb 0, transparent 45%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-5 lg:px-8 py-20 sm:py-28">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-elite-gold/30 bg-elite-gold/10 px-4 py-1.5 text-elite-gold text-xs font-bold mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            Centre de langues et de communication
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
            À propos du centre
          </h1>
          <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-300">
            Depuis 2018, {schoolName} accompagne les élèves et les professionnels de Khénifra dans
            l&apos;apprentissage des langues et la préparation aux examens internationaux, avec une
            approche progressive, humaine et orientée vers la communication réelle.
          </p>

          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              ["2018", "Année de création"],
              ["5", "Langues enseignées"],
              ["+1 200", "Élèves accompagnés"],
              ["4", "Certifications préparées"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-2xl sm:text-3xl font-extrabold text-brand-400">{value}</div>
                <div className="text-[11px] sm:text-xs text-slate-300 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INFORMATIONS PRATIQUES ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Nous trouver</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight mt-2">
              Informations pratiques
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base">
              Notre secrétariat est à votre disposition pour toute information ou pour planifier votre test de niveau.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <MapPin className="h-6 w-6 text-brand-600" aria-hidden="true" />
              <h3 className="mt-4 font-bold text-navy-950">Adresse</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{schoolAddress}</p>
              <Link href="/#contact" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 mt-4 hover:text-brand-500">
                Voir l&apos;accès <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Phone className="h-6 w-6 text-brand-600" aria-hidden="true" />
              <h3 className="mt-4 font-bold text-navy-950">Téléphone</h3>
              <a href={telHref(schoolPhone)} className="block text-sm font-semibold text-slate-700 mt-2 hover:text-brand-600">
                {schoolPhone}
              </a>
              <p className="text-xs text-slate-500 mt-3">Appel direct, sans formulaire.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Mail className="h-6 w-6 text-brand-600" aria-hidden="true" />
              <h3 className="mt-4 font-bold text-navy-950">Courriel</h3>
              <a
                href={`mailto:${schoolEmail}`}
                className="block text-sm font-semibold text-slate-700 mt-2 hover:text-brand-600 break-all"
              >
                {schoolEmail}
              </a>
              <p className="text-xs text-slate-500 mt-3">Réponse sous 24 h ouvrées.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-navy-950 text-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm leading-relaxed">
                Des cours en journée et en soirée. Les horaires exacts de chaque groupe sont
                communiqués par le secrétariat lors de l&apos;inscription.
              </p>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-colors"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Discuter sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FORMATIONS & CERTIFICATIONS ── */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-2 text-brand-600 font-bold uppercase tracking-wider text-xs">
                <Languages className="h-4 w-4" aria-hidden="true" />
                Nos formations
              </div>
              <h2 className="text-3xl font-extrabold text-navy-950 tracking-tight mt-3">
                Cinq langues, une méthode
              </h2>
              <ul className="mt-8 space-y-4">
                {languages.map(([name, detail]) => (
                  <li key={name} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <div className="font-bold text-navy-950">{name}</div>
                      <div className="text-sm text-slate-600 mt-0.5">{detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/#formations"
                className="inline-flex items-center gap-2 mt-8 text-sm font-bold text-brand-600 hover:text-brand-500"
              >
                Découvrir les formules <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div>
              <div className="flex items-center gap-2 text-brand-600 font-bold uppercase tracking-wider text-xs">
                <Award className="h-4 w-4" aria-hidden="true" />
                Certifications
              </div>
              <h2 className="text-3xl font-extrabold text-navy-950 tracking-tight mt-3">
                Préparer son examen sereinement
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {certifications.map((name) => (
                  <div
                    key={name}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-bold text-navy-950"
                  >
                    {name}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-600 mt-6 leading-relaxed">
                Épreuves types chronométrées, simulations d&apos;expression orale individuelles et
                stratégies de rédaction pour viser le score requis.
              </p>
              <Link
                href="/#certifications"
                className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-brand-600 hover:text-brand-500"
              >
                Voir les certificats <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MÉTHODE ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-brand-600 font-bold uppercase tracking-wider text-xs">Notre méthode</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight mt-2">
              Apprendre pour communiquer
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Groupes réduits",
                text: "Effectifs réduits pour laisser une place réelle à la parole et à la correction individualisée.",
              },
              {
                icon: BookOpen,
                title: "Méthode communicative",
                text: "Des situations concrètes, du niveau débutant aux niveaux avancés, toujours orientées vers l'usage.",
              },
              {
                icon: ShieldCheck,
                title: "Suivi transparent",
                text: "Évaluations continues, présences et paiements consultables depuis l'espace élève numérique.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-6 w-6 text-brand-600" aria-hidden="true" />
                <h3 className="mt-4 font-bold text-navy-950">{title}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-navy-950 text-slate-300">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-white font-bold">{schoolName}</div>
            <div className="text-xs text-slate-400 mt-1">{schoolAddress}</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <Link href="/" className="hover:text-white transition-colors">
              Accueil
            </Link>
            <Link href="/#contact" className="hover:text-white transition-colors">
              Contact
            </Link>
            <a href={telHref(schoolPhone)} className="hover:text-white transition-colors">
              {schoolPhone}
            </a>
            <a href={`mailto:${schoolEmail}`} className="hover:text-white transition-colors">
              {schoolEmail}
            </a>
          </div>
        </div>
        <div className="border-t border-navy-900 text-center text-slate-500 text-xs py-6">
          © {new Date().getUTCFullYear()} {schoolName}. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
