import { db } from "@/lib/db";
import { firstOfMonth } from "@/lib/fees";
import { monthKey } from "@/lib/invoicing";
import { sendReminders } from "@/lib/reminders";

function isAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET non configuré" }, { status: 503 });
  if (!isAuthorized(req)) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const month = firstOfMonth();
  const schools = await db.school.findMany({ select: { id: true } });
  let sent = 0;
  const skipped = 0;

  for (const school of schools) {
    const count = await sendReminders(school.id, month, { onlyOverdue: true });
    sent += count;
  }

  return Response.json({ ok: true, month: monthKey(month), sent, skipped });
}

/**
 * Payment reminders hook.
 * - Vercel Cron calls GET with `Authorization: Bearer <CRON_SECRET>`.
 * - Manual / external cron can call POST with the same header.
 */
export const GET = run;
export const POST = run;
