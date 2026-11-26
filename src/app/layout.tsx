import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

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
  sameAs: [
    "https://www.facebook.com/TheEliteCentreofLanguagesandCommunication",
    "https://www.instagram.com/elitekacemcenter",
  ],
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
    <html lang="fr" className={`h-full scroll-smooth ${dmSans.variable} ${playfair.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

