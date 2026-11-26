import { db } from "@/lib/db";
import { createRequestId, logError, REQUEST_ID_HEADER } from "@/lib/logger";
import { sendOverdueReminders } from "@/lib/reminders";
import { requireSecret, safeEqual } from "@/lib/secrets";

function isAuthorized(req: Request, secret: string) {
  const header = req.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  return safeEqual(provided, secret);
}

function jsonError(message: string, status: number, requestId: string) {
  return Response.json(
    { ok: false, error: message, requestId },
    { status, headers: { [REQUEST_ID_HEADER]: requestId } },
  );
}

async function run(req: Request) {
  const requestId = createRequestId();
  try {
    let secret: string;
    try {
      secret = requireSecret("CRON_SECRET");
    } catch {
      return jsonError("CRON_SECRET non configuré", 503, requestId);
    }
    if (!isAuthorized(req, secret)) {
      return jsonError("Non autorisé", 401, requestId);
    }

    const schools = await db.school.findMany({ select: { id: true } });
    let sent = 0;

    for (const school of schools) {
      sent += await sendOverdueReminders(school.id);
    }

    return Response.json(
      { ok: true, sent, at: new Date().toISOString(), requestId },
      { headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  } catch (error) {
    logError("cron.payment-reminders", error, { requestId });
    return jsonError("Erreur interne", 500, requestId);
  }
}

/**
 * Payment reminders hook (runs daily).
 * - Vercel Cron calls GET with `Authorization: Bearer <CRON_SECRET>`.
 * - Manual / external cron can call POST with the same header.
 */
export const GET = run;
export const POST = run;
