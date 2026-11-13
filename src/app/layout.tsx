import type { Metadata, Viewport } from "next";
import "./globals.css";

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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
