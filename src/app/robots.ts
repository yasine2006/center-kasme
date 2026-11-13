import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://center-kasme.vercel.app";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/teacher/", "/student/", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
