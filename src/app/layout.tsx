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
  title: { default: "The Elite Centre | Centre de langues à Khénifra", template: "%s · The Elite Centre" },
  description: "The Elite Centre of Languages and Communication à Khénifra. Formations en langues (Anglais, Français, Allemand, Espagnol, Italien) et préparation aux examens IELTS, TOEFL, TCF, DELF.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://center-kasme.vercel.app"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "The Elite Centre",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#08295f" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full scroll-smooth">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

