import type { Metadata, Viewport } from "next";
import "./globals.css";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "The Elite Centre of Languages and Communication",
  description: "Centre d'élite pour les langues et la communication à Khénifra.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Boulevard Mohammed V, Dar Attalib, appt n°4",
    addressLocality: "Khénifra",
    postalCode: "54000",
    addressCountry: "MA",
  },
  telephone: "+212642539608",
  email: "elitekacemcenter@gmail.com",
};

export const metadata: Metadata = {
  title: { default: "Gestion scolaire", template: "%s · Gestion scolaire" },
  description: "Plateforme de gestion scolaire : élèves, matières, groupes, présences et paiements.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://center-kasme.vercel.app"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Gestion scolaire",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b1b3b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

