import { NextResponse } from "next/server";
import { generateMissingInvoices, monthKey } from "@/lib/invoicing";
import { createRequestId, logError, REQUEST_ID_HEADER } from "@/lib/logger";
import { requireSecret, safeEqual } from "@/lib/secrets";

function isAuthorized(request: Request, secret: string) {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.replace(/^Bearer\s+/i, "").trim();
  const provided = bearer || (request.headers.get("x-cron-secret") ?? "").trim();
  return safeEqual(provided, secret);
}

function jsonError(message: string, status: number, requestId: string) {
  return NextResponse.json(
    { ok: false, error: message, requestId },
    { status, headers: { [REQUEST_ID_HEADER]: requestId } },
  );
}

async function run(request: Request) {
  const requestId = createRequestId();
  try {
    let secret: string;
    try {
      secret = requireSecret("CRON_SECRET");
    } catch {
      return jsonError("CRON_SECRET is not configured", 503, requestId);
    }
    if (!isAuthorized(request, secret)) {
      return jsonError("unauthorized", 401, requestId);
    }

    const generated = await generateMissingInvoices();
    return NextResponse.json(
      {
        ok: true,
        generated,
        month: monthKey(new Date()),
        at: new Date().toISOString(),
        requestId,
      },
      { headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  } catch (error) {
    logError("cron.monthly-invoices", error, { requestId });
    return jsonError("internal error", 500, requestId);
  }
}

/**
 * Monthly invoicing hook.
 * - Vercel Cron calls GET with `Authorization: Bearer <CRON_SECRET>`.
 * - Manual / external cron can call POST with the same header.
 */
export const GET = run;
export const POST = run;
