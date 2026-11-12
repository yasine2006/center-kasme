"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { invoiceTotals } from "@/lib/fees";
import {
  billingAnchor,
  cycleForDate,
  cycleForMonth,
  ensureInvoiceForCycle,
  generateMissingInvoices,
  monthKey,
  parseMonthKey,
} from "@/lib/invoicing";
import { formatDH } from "@/lib/format";
import { requireRole } from "@/lib/session";

const schema = z.object({
  amount: z.coerce.number().positive("Montant invalide"),
  method: z.enum(["CASH", "TRANSFER"]),
  reference: z.string().trim().optional(),
});

export type PayState = { errors?: Record<string, string[] | undefined>; message?: string };

export async function recordPayment(invoiceId: number, _: PayState, formData: FormData): Promise<PayState> {
  const session = await requireRole("ADMIN");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };

  const amount = new Prisma.Decimal(parsed.data.amount.toString());
  const rawLine = formData.get("lineId");
  const lineId = typeof rawLine === "string" && /^\d+$/.test(rawLine) ? Number(rawLine) : null;

  const result = await db.$transaction(
    async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, student: { schoolId: session.schoolId } },
        include: { lines: true, payments: true, student: true },
      });
      if (!invoice) return { kind: "missing" as const };

      let remainingDecimal = invoiceTotals(invoice).remainingDecimal;
      let label: string | null = null;

      if (lineId !== null) {
        const line = invoice.lines.find((l) => l.id === lineId);
        if (!line) return { kind: "missing" as const };
        const attributed = invoice.payments
          .filter((p) => p.lineId === lineId)
          .reduce((sum, p) => sum.plus(new Prisma.Decimal(p.amount.toString())), new Prisma.Decimal(0));
        const lineRemaining = new Prisma.Decimal(line.amount.toString()).minus(attributed);
        remainingDecimal = lineRemaining.greaterThan(0) ? lineRemaining : new Prisma.Decimal(0);
        label = line.label;
      }

      if (amount.greaterThan(remainingDecimal)) {
        return { kind: "over" as const, remaining: remainingDecimal.toNumber(), label };
      }

      const payment = await tx.payment.create({
        data: { invoiceId, lineId, amount, method: parsed.data.method, reference: parsed.data.reference || null },
      });
      const withReceipt = await tx.payment.update({
        where: { id: payment.id },
        data: { receiptNo: `R-${new Date().getUTCFullYear()}-${String(payment.id).padStart(4, "0")}` },
      });

      return { kind: "ok" as const, invoice, payment: withReceipt, label };
    },
    { maxWait: 5000, timeout: 15000 },
  );

  if (result.kind === "missing") return { message: "Facture introuvable." };
  if (result.kind === "over") {
    return {
      errors: {
        amount: [
          result.label
            ? `Maximum ${formatDH(result.remaining)} pour ${result.label} (reste à payer)`
            : `Maximum ${formatDH(result.remaining)} (reste à payer)`,
        ],
      },
    };
  }

  const { invoice, payment, label } = result;

  // in-app notification for the student, if their account is linked
  if (invoice.student.userId) {
    await db.notification.create({
      data: {
        userId: invoice.student.userId,
        title: "Paiement reçu",
        body: `Un paiement de ${formatDH(parsed.data.amount)}${label ? ` (${label})` : ""} a été enregistré.`,
      },
    });
  }

  await audit(session, "PAYMENT", "Payment", payment.id, { invoiceId, lineId, amount: parsed.data.amount, method: parsed.data.method });
  revalidatePath("/admin", "layout");
  redirect("/admin/invoices");
}

/** Creates every missing cycle invoice for the school, up to the current cycle. */
export async function generateMonthlyInvoices() {
  const session = await requireRole("ADMIN");
  const created = await generateMissingInvoices(session.schoolId);

  await audit(session, "CREATE", "Invoice", undefined, { generated: created, upTo: new Date().toISOString().slice(0, 10) });
  revalidatePath("/admin", "layout");
}

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "Mois invalide");

/** Opens (and creates if needed) the cycle that starts in a given month. */
export async function openInvoiceForMonth(studentId: number, rawMonth: string) {
  const session = await requireRole("ADMIN");
  const parsed = monthSchema.safeParse(rawMonth);
  if (!parsed.success) return;
  const month = parseMonthKey(parsed.data);
  if (!month) return;

  const student = await db.student.findFirst({
    where: { id: studentId, schoolId: session.schoolId },
    include: { enrollments: { include: { group: true } } },
  });
  if (!student) return;

  const anchor = billingAnchor(student.enrollments);
  if (!anchor) {
    await audit(session, "CREATE", "Invoice", undefined, { studentId, month: parsed.data, skipped: "no-enrollment" });
    redirect(`/admin/enrollments?studentId=${studentId}`);
  }

  const cycle = cycleForMonth(anchor, month);
  if (cycle.start.getTime() < anchor.getTime()) {
    await audit(session, "CREATE", "Invoice", undefined, { studentId, month: parsed.data, skipped: "before-enrollment" });
    redirect(`/admin/enrollments?studentId=${studentId}`);
  }

  const active = student.enrollments.filter((e) => e.status === "ACTIVE");
  const existing = await db.invoice.findUnique({ where: { studentId_month: { studentId, month: cycle.month } } });
  const invoice = await db.$transaction(
    (tx) => ensureInvoiceForCycle(tx, studentId, cycle, active),
    { maxWait: 5000, timeout: 15000 },
  );

  if (!invoice) {
    await audit(session, "CREATE", "Invoice", undefined, { studentId, month: parsed.data, skipped: "no-enrollment" });
    redirect(`/admin/enrollments?studentId=${studentId}`);
  }

  await audit(session, existing ? "UPDATE" : "CREATE", "Invoice", invoice.id, {
    studentId,
    month: parsed.data,
    periodStart: cycle.start.toISOString(),
    periodEnd: cycle.end.toISOString(),
  });
  revalidatePath("/admin", "layout");
  redirect(`/admin/invoices/${invoice.id}`);
}

/** Opens (and creates if needed) the cycle that is currently running for one student. */
export async function ensureMonthlyInvoice(studentId: number) {
  const session = await requireRole("ADMIN");

  const student = await db.student.findFirst({
    where: { id: studentId, schoolId: session.schoolId },
    include: { enrollments: { include: { group: true } } },
  });
  if (!student) return;

  const anchor = billingAnchor(student.enrollments);
  if (!anchor) redirect(`/admin/enrollments?studentId=${studentId}`);

  const cycle = cycleForDate(anchor, new Date());
  const active = student.enrollments.filter((e) => e.status === "ACTIVE");
  const existing = await db.invoice.findUnique({ where: { studentId_month: { studentId, month: cycle.month } } });
  const invoice = await db.$transaction(
    (tx) => ensureInvoiceForCycle(tx, studentId, cycle, active),
    { maxWait: 5000, timeout: 15000 },
  );

  if (!invoice) redirect(`/admin/enrollments?studentId=${studentId}`); // nothing to bill yet

  await audit(session, existing ? "UPDATE" : "CREATE", "Invoice", invoice.id, {
    studentId,
    month: monthKey(cycle.month),
    periodStart: cycle.start.toISOString(),
    periodEnd: cycle.end.toISOString(),
  });
  revalidatePath("/admin", "layout");
  redirect(`/admin/invoices/${invoice.id}`);
}
