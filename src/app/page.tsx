import { getSession, homeFor } from "@/lib/session";
import { LandingPage } from "@/components/landing-page";

export default async function Home() {
  const session = await getSession();
  const dashboardUrl = session ? homeFor(session.role) : null;

  return (
    <LandingPage
      session={session ? { name: session.name, role: session.role } : null}
      dashboardUrl={dashboardUrl}
    />
  );
}
