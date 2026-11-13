import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { invoicePdf } from "@/lib/pdf";
import { invoiceStatus, invoiceTotals, statusMeta } from "@/lib/fees";

export async function GET(_: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Non authentifié", { status: 401 });

  const id = Number((await params).invoiceId);
  if (!Number.isInteger(id)) return new Response("Introuvable", { status: 404 });

  const invoice = await db.invoice.findFirst({
    where: { id, student: { schoolId: session.schoolId } },
    include: { lines: true, payments: { orderBy: { paidAt: "desc" } }, student: { include: { school: true } } },
  });
  if (!invoice) return new Response("Introuvable", { status: 404 });

  const { student } = invoice;
  const allowed = session.role === "ADMIN" || (session.role === "STUDENT" && student.userId === session.userId);
  if (!allowed) return new Response("Interdit", { status: 403 });

  const totals = invoiceTotals(invoice);
  const status = statusMeta[invoiceStatus(invoice)].label;
  const pdf = invoicePdf({
    school: student.school,
    invoiceNo: `F-${invoice.id}`,
    issuedAt: invoice.periodStart,
    student: `${student.firstName} ${student.lastName}`,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    dueDate: invoice.dueDate,
    lines: invoice.lines.map((l) => ({ label: l.label, amount: Number(l.amount.toString()) })),
    due: totals.due,
    paid: totals.paid,
    remaining: totals.remaining,
    status,
    payments: invoice.payments.map((p) => ({
      date: p.paidAt,
      amount: Number(p.amount.toString()),
      method: p.method === "CASH" ? "Espèces" : "Virement",
      reference: p.reference,
    })),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Facture-F-${invoice.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
