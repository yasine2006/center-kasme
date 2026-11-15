import { db } from "@/lib/db";
import { getSession, homeFor } from "@/lib/session";
import { LandingPage } from "@/components/landing-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [session, school] = await Promise.all([
    getSession().catch(() => null),
    db.school
      .findFirst({
        select: {
          name: true,
          logo: true,
          address: true,
          phone: true,
          email: true,
        },
      })
      .catch(() => null),
  ]);

  const dashboardUrl = session ? homeFor(session.role) : null;

  return (
    <LandingPage
      school={school}
      session={session ? { name: session.name, role: session.role } : null}
      dashboardUrl={dashboardUrl}
    />
  );
}
