import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, homeFor } from "@/lib/session";

export const metadata: Metadata = {
  title: "The Elite Centre of Languages and Communication — Khénifra",
  description:
    "Centre d'élite pour les langues et la communication à Khénifra. Cours d'allemand, anglais, français, espagnol et italien — de débutant à avancé. Préparation IELTS, TOEFL, TCF, DELF. Inscriptions ouvertes.",
  keywords: [
    "centre de langues Khénifra",
    "cours d'anglais Khénifra",
    "cours de français Khénifra",
    "IELTS TOEFL TCF DELF Khénifra",
    "école de langues Maroc",
    "The Elite Centre of Languages and Communication",
  ],
  openGraph: {
    title: "The Elite Centre of Languages and Communication — Khénifra",
    description: "Apprenez aujourd'hui, créez vos opportunités demain !",
    type: "website",
    locale: "fr_FR",
  },
};

const LANGUAGES = [
  { flag: "🇩🇪", name: "Allemand" },
  { flag: "🇬🇧", name: "Anglais" },
  { flag: "🇫🇷", name: "Français" },
  { flag: "🇪🇸", name: "Espagnol" },
  { flag: "🇮🇹", name: "Italien" },
];

const SKILLS = [
  { icon: "🗣️", label: "Parler" },
  { icon: "👂", label: "Écouter" },
  { icon: "📖", label: "Lire" },
  { icon: "✍️", label: "Écrire" },
];

const CERTS = ["IELTS", "TOEFL", "TCF", "DELF"];

export default async function Home() {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));

  const school = await db.school.findFirst({ select: { name: true, logo: true } }).catch(() => null);
  const name = school?.name ?? "The Elite Centre of Languages and Communication";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ── Header / Nav ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {school?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.logo} alt={name} className="h-10 w-10 rounded-xl object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white font-bold">E</div>
            )}
            <span className="text-lg font-bold tracking-tight text-navy-900">{name}</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#cours" className="hover:text-navy-900">Cours</a>
            <a href="#certifications" className="hover:text-navy-900">Certifications</a>
            <a href="#contact" className="hover:text-navy-900">Contact</a>
          </nav>
          <Link href="/login" className="rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-800">
            Espace de gestion
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-slate-800 text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-sky-300">Khénifra · Maroc</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
            The Elite Centre of Languages and Communication
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200 md:text-xl">
            Centre d&apos;élite pour les langues et la communication. Apprenez aujourd&apos;hui, créez vos opportunités demain !
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-navy-900 shadow transition hover:bg-slate-100">
              S&apos;inscrire maintenant
            </a>
            <a href="#cours" className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Découvrir les cours
            </a>
          </div>
          <p className="mt-6 text-sm text-sky-200">🔥 Inscriptions ouvertes — places limitées !</p>
        </div>
      </section>

      {/* ── Langues ── */}
      <section id="cours" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold tracking-tight text-navy-900">Nos langues</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Des débutants aux avancés, des jeunes aux aînés — des programmes adaptés à chaque profil.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {LANGUAGES.map((l) => (
            <div key={l.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center transition hover:border-navy-900 hover:shadow-md">
              <div className="text-4xl">{l.flag}</div>
              <p className="mt-3 font-semibold text-navy-900">{l.name}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-12 text-xl font-bold text-navy-900">Compétences développées</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SKILLS.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
              <span className="text-2xl">{s.icon}</span>
              <span className="font-medium text-slate-700">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Certifications ── */}
      <section id="certifications" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold tracking-tight text-navy-900">Certifications préparées</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Préparation aux examens internationaux avec des professeurs qualifiés et des programmes modernes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {CERTS.map((c) => (
              <span key={c} className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white">{c}</span>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="font-semibold text-emerald-900">🏅 Certifié par le ministère de l&apos;Éducation nationale</p>
            <p className="mt-1 text-sm text-emerald-800">Garantissant la qualité de l&apos;éducation privée.</p>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold tracking-tight text-navy-900">Contact &amp; Inscriptions</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-navy-900">📍 Adresse</h3>
            <p className="mt-2 text-slate-600">
              Boulevard Mohammed V, Dar Attalib, appt n°4<br />
              Khénifra 54000, Maroc
            </p>
            <h3 className="mt-6 font-semibold text-navy-900">📲 Téléphone / WhatsApp</h3>
            <p className="mt-2">
              <a href="tel:+212642539608" className="text-navy-900 font-semibold hover:underline">0642-539608</a>
            </p>
            <h3 className="mt-6 font-semibold text-navy-900">✉️ Email</h3>
            <p className="mt-2">
              <a href="mailto:elitekacemcenter@gmail.com" className="text-navy-900 font-semibold hover:underline">elitekacemcenter@gmail.com</a>
            </p>
          </div>
          <div className="rounded-2xl bg-navy-900 p-6 text-white">
            <h3 className="text-xl font-bold">Prêt à commencer ?</h3>
            <p className="mt-2 text-slate-200">
              Les inscriptions sont ouvertes et les places sont limitées. Contactez-nous dès aujourd&apos;hui pour réserver votre place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="tel:+212642539608" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 transition hover:bg-slate-100">
                Appeler maintenant
              </a>
              <a href="https://wa.me/212642539608" target="_blank" rel="noreferrer" className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                WhatsApp
              </a>
            </div>
            <p className="mt-6 text-xs text-slate-300">
              Vous êtes déjà inscrit ?{" "}
              <Link href="/login" className="font-semibold text-sky-300 hover:underline">Accéder à votre espace</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
          <p className="font-semibold text-navy-900">{name}</p>
          <p className="mt-1">Boulevard Mohammed V, Dar Attalib, appt n°4 · Khénifra 54000 · Maroc</p>
          <p className="mt-3 text-xs">© {new Date().getFullYear()} {name}. Tous droits réservés.</p>
        </div>
      </footer>
    </main>
  );
}
