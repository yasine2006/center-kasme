import { db } from "@/lib/db";
import { requireSecret, safeEqual } from "@/lib/secrets";
import { sendOverdueReminders } from "@/lib/reminders";

function isAuthorized(req: Request, secret: string) {
  const header = req.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  return safeEqual(provided, secret);
}

async function run(req: Request) {
  let secret: string;
  try {
    secret = requireSecret("CRON_SECRET");
  } catch {
    return Response.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  }
  if (!isAuthorized(req, secret)) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const schools = await db.school.findMany({ select: { id: true } });
  let sent = 0;

  for (const school of schools) {
    sent += await sendOverdueReminders(school.id);
  }

  return Response.json({ ok: true, sent, at: new Date().toISOString() });
}

/**
 * Payment reminders hook (runs daily).
 * - Vercel Cron calls GET with `Authorization: Bearer <CRON_SECRET>`.
 * - Manual / external cron can call POST with the same header.
 */
export const GET = run;
export const POST = run;
