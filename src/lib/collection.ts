import "server-only";
import { db } from "@/lib/db";
import { invoiceTotals } from "@/lib/fees";
import { lateDaysForMonth } from "@/lib/late-days";

export async function canForceDeleteStudent(studentId: number, schoolId: number) {
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    include: {
      invoices: {
        include: { lines: true, payments: true },
        orderBy: { month: "desc" },
      },
    },
  });
  if (!student) return { ok: false as const, reason: "Introuvable" };

  const now = new Date();
  let maxDaysLate = 0;
  let unpaid = 0;

  for (const invoice of student.invoices) {
    const t = invoiceTotals(invoice);
    if (t.remaining <= 0) continue;
    unpaid += t.remaining;
    const days = lateDaysForMonth(invoice.periodStart, invoice.month, now);
    if (days > maxDaysLate) maxDaysLate = days;
  }

  if (unpaid <= 0) return { ok: false as const, reason: "Aucun impayé" };
  if (maxDaysLate <= 30) return { ok: false as const, reason: "Délai < 31 jours" };

  return { ok: true as const, maxDaysLate, unpaid };
}

