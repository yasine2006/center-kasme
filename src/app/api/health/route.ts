import { db } from "@/lib/db";
import { createRequestId, logError, REQUEST_ID_HEADER } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const requestId = createRequestId();
  const headers = { [REQUEST_ID_HEADER]: requestId };
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.trim();

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json(
      {
        status: "ok",
        db: "up",
        latencyMs: Date.now() - startedAt,
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
        requestId,
        ...(commit ? { commit } : {}),
      },
      { headers },
    );
  } catch (error) {
    logError("api.health", error, { requestId });
    return Response.json(
      {
        status: "degraded",
        db: "down",
        timestamp: new Date().toISOString(),
        requestId,
        ...(commit ? { commit } : {}),
      },
      { status: 503, headers },
    );
  }
}
