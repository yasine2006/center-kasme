import type { NextRequest } from "next/server";
import { requireApiRole } from "@/lib/session";
import { buildDataset } from "@/lib/reports";

/** Lightweight JSON preview used by the report builder (8 first rows + total count). */
export async function GET(req: NextRequest) {
  const session = await requireApiRole("ADMIN");
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const ds = await buildDataset(session.schoolId, req.nextUrl.searchParams);
  return Response.json(
    {
      title: ds.title,
      subtitle: ds.subtitle ?? null,
      head: ds.head,
      rows: ds.rows.slice(0, 20),
      total: ds.rows.length,
      money: ds.money,
      stats: ds.stats ?? null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
