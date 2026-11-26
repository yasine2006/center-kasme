import { NextResponse } from "next/server";
import { generateMissingInvoices, monthKey } from "@/lib/invoicing";
import { requireSecret, safeEqual } from "@/lib/secrets";

function isAuthorized(request: Request, secret: string) {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.replace(/^Bearer\s+/i, "").trim();
  const provided = bearer || (request.headers.get("x-cron-secret") ?? "").trim();
  return safeEqual(provided, secret);
}

async function run(request: Request) {
  let secret: string;
  try {
    secret = requireSecret("CRON_SECRET");
  } catch {
    return NextResponse.json({ ok: false, error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const generated = await generateMissingInvoices();
  return NextResponse.json({ ok: true, generated, month: monthKey(new Date()), at: new Date().toISOString() });
}

/**
 * Monthly invoicing hook.
 * - Vercel Cron calls GET with `Authorization: Bearer <CRON_SECRET>`.
 * - Manual / external cron can call POST with the same header.
 */
export const GET = run;
export const POST = run;
