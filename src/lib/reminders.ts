import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { invoiceTotals } from "@/lib/fees";
import { formatDH, formatPeriod } from "@/lib/format";
import { billingAnchor, cycleForMonth, enrollmentsBillableFor, monthKey, monthStart } from "@/lib/invoicing";
import { enrollmentAnchor, isDueAsOf, lateDaysForMonth, monthlyDueDate } from "@/lib/late-days";

export const REMINDER_TITLE = "Rappel de paiement";

export type ReminderStatus = "PAID" | "PARTIAL" | "UNPAID" | "MISSING";

export type ReminderRow = {
  studentId: number;
  firstName: string;
  lastName: string;
  parentName: string | null;
  phone: string | null;
  userId: number | null;
  invoiceId: number | null;
  /** Ancre d'inscription (UTC), null si l'élève n'a pas d'inscription. */
  enrollmentStart: Date | null;
  /** Échéance mensuelle effective, fallback sur l'échéance de la facture. */
  dueDate: Date | null;
  /** L'échéance du mois sélectionné est-elle atteinte à `now` ? */
  isDueAsOfToday: boolean;
  status: ReminderStatus;
  due: number;
  paid: number;
  remaining: number;
  daysLate: number;
  remindedAt: Date | null;
  remindedToday: boolean;
  periodStart: Date | null;
  periodEnd: Date | null;
  waHref: string | null;
};

const startOfDay = (d = new Date()) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

function normalizePhone(raw: string | null) {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `212${digits.slice(1)}`;
  return /^\d{9,15}$/.test(digits) ? digits : null;
}

export function reminderText(
  row: Pick<ReminderRow, "firstName" | "remaining" | "daysLate" | "periodStart" | "periodEnd">,
) {
  const late = row.daysLate > 0 ? ` (retard de ${row.daysLate} jour${row.daysLate > 1 ? "s" : ""})` : "";
  const period = row.periodStart && row.periodEnd ? ` de la période ${formatPeriod(row.periodStart, row.periodEnd)}` : "";
  return `Bonjour ${row.firstName}, la facture${period} n'est pas encore réglée${late}. Reste à payer : ${formatDH(row.remaining)}. Merci de régulariser.`;
}

export async function reminderRows(schoolId: number, month: Date): Promise<ReminderRow[]> {
  const students = await db.student.findMany({
    where: { schoolId, archived: false, status: "ACTIVE", enrollments: { some: { status: "ACTIVE" } } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      parentName: true,
      parentPhone: true,
      userId: true,
      enrollments: {
        select: { id: true, status: true, startedAt: true, monthlyFee: true, group: { select: { name: true } } },
      },
      invoices: {
        where: { month },
        select: {
          id: true,
          dueDate: true,
          periodStart: true,
          periodEnd: true,
          lines: { select: { amount: true } },
          payments: { select: { amount: true } },
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  if (!students.length) return [];

  const invoiceIds = students.flatMap((s) => s.invoices.map((i) => i.id));
  const logs = invoiceIds.length
    ? await db.auditLog.findMany({
        where: { schoolId, action: "REMINDER", entity: "Invoice", entityId: { in: invoiceIds } },
        orderBy: { createdAt: "desc" },
        select: { entityId: true, createdAt: true },
      })
    : [];

  const lastReminder = new Map<number, Date>();
  const today = new Set<number>();
  const sod = startOfDay();
  for (const log of logs) {
    if (log.entityId === null) continue;
    if (!lastReminder.has(log.entityId)) lastReminder.set(log.entityId, log.createdAt);
    if (log.createdAt >= sod) today.add(log.entityId);
  }

  const now = new Date();

  return students.flatMap((s) => {
    const anchor = billingAnchor(s.enrollments);
    if (!anchor) return [];

    const cycle = cycleForMonth(anchor, month);
    if (cycle.start.getTime() < anchor.getTime()) return []; // month before the first enrollment

    const active = s.enrollments.filter((e) => e.status === "ACTIVE");
    const invoice = s.invoices[0] ?? null;
    const expected = enrollmentsBillableFor(active, cycle.end)
      .reduce((sum, e) => sum.plus(new Prisma.Decimal(e.monthlyFee.toString())), new Prisma.Decimal(0))
      .toNumber();
    if (!invoice && expected <= 0) return [];

    const totals = invoice ? invoiceTotals(invoice) : null;
    const due = totals ? totals.due : expected;
    const paid = totals ? totals.paid : 0;
    const remaining = totals ? totals.remaining : expected;
    const status: ReminderStatus = !invoice
      ? "MISSING"
      : remaining <= 0
        ? "PAID"
        : paid > 0
          ? "PARTIAL"
          : "UNPAID";
    // Échéance = anniversaire mensuel de l'inscription, retard remis à 0 chaque mois.
    const start = enrollmentAnchor(s.enrollments);
    const dueDate = start ? monthlyDueDate(start, month) : (invoice?.dueDate ?? null);
    const isDueAsOfToday = start ? isDueAsOf(start, month, now) : true;
    const daysLate = remaining > 0 && start ? lateDaysForMonth(start, month, now) : 0;
    const remindedAt = invoice ? (lastReminder.get(invoice.id) ?? null) : null;
    const phone = normalizePhone(s.parentPhone);

    const row: ReminderRow = {
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      parentName: s.parentName,
      phone,
      userId: s.userId,
      invoiceId: invoice?.id ?? null,
      enrollmentStart: start,
      dueDate,
      isDueAsOfToday,
      status,
      due,
      paid,
      remaining: remaining > 0 ? remaining : 0,
      daysLate,
      remindedAt,
      remindedToday: invoice ? today.has(invoice.id) : false,
      periodStart: invoice?.periodStart ?? cycle.start,
      periodEnd: invoice?.periodEnd ?? cycle.end,
      waHref: null,
    };
    row.waHref = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(reminderText(row))}` : null;
    return [row];
  });
}

export type RemindOptions = {
  studentIds?: number[];
  onlyOverdue?: boolean;
  /** Ne relancer que les échéances atteintes jusqu'à aujourd'hui, dans le mois demandé. */
  onlyDueAsOfToday?: boolean;
  /** Autoriser un second envoi le même jour (boutons de relance global). */
  allowRepeat?: boolean;
};

export async function sendReminders(schoolId: number, month: Date, opts: RemindOptions = {}) {
  const rows = (await reminderRows(schoolId, month)).filter(
    (r) =>
      r.invoiceId !== null &&
      r.remaining > 0 &&
      r.userId !== null &&
      (opts.allowRepeat === true || !r.remindedToday) &&
      (!opts.studentIds || opts.studentIds.includes(r.studentId)) &&
      (!opts.onlyOverdue || r.daysLate > 0) &&
      (!opts.onlyDueAsOfToday || r.isDueAsOfToday),
  );
  if (!rows.length) return 0;

  const actor = await db.user.findFirst({ where: { schoolId }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) return 0;

  await db.$transaction(
    rows.map((r) =>
      db.notification.create({
        data: { userId: r.userId!, title: REMINDER_TITLE, body: reminderText(r) },
      }),
    ),
  );

  await db.auditLog.createMany({
    data: rows.map((r) => ({
      schoolId,
      userId: actor.id,
      action: "REMINDER",
      entity: "Invoice",
      entityId: r.invoiceId,
      details: { studentId: r.studentId, month: monthKey(month), remaining: r.remaining },
    })),
  });

  return rows.length;
}

/**
 * Cycle-agnostic reminders used by the daily cron: every invoice whose due date
 * has passed and that is not fully paid. One notification per invoice per day.
 */
export async function sendOverdueReminders(schoolId: number, now = new Date()) {
  const invoices = await db.invoice.findMany({
    where: {
      student: { schoolId, archived: false, status: "ACTIVE" },
      // Pré-filtre large : l'échéance effective est recalculée ci-dessous, on ne
      // fait pas confiance à un Invoice.dueDate éventuellement périmé.
      month: { lte: monthStart(now) },
    },
    include: {
      lines: { select: { amount: true } },
      payments: { select: { amount: true } },
      student: { select: { id: true, firstName: true, lastName: true, userId: true } },
    },
    orderBy: { dueDate: "asc" },
  });
  if (!invoices.length) return 0;

  const ids = invoices.map((i) => i.id);
  const logs = await db.auditLog.findMany({
    where: { schoolId, action: "REMINDER", entity: "Invoice", entityId: { in: ids } },
    orderBy: { createdAt: "desc" },
    select: { entityId: true, createdAt: true },
  });
  const today = new Set<number>();
  const sod = startOfDay(now);
  for (const log of logs) {
    if (log.entityId !== null && log.createdAt >= sod) today.add(log.entityId);
  }

  const rows = invoices
    .map((invoice) => {
      const totals = invoiceTotals(invoice);
      if (totals.remaining <= 0) return null;
      if (!invoice.student.userId) return null;
      if (today.has(invoice.id)) return null;
      const dueDate = monthlyDueDate(invoice.periodStart, invoice.month);
      if (startOfDay(now).getTime() < startOfDay(dueDate).getTime()) return null;
      const daysLate = lateDaysForMonth(invoice.periodStart, invoice.month, now);
      return {
        invoiceId: invoice.id,
        userId: invoice.student.userId,
        studentId: invoice.student.id,
        firstName: invoice.student.firstName,
        remaining: totals.remaining,
        daysLate,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (!rows.length) return 0;

  const actor = await db.user.findFirst({ where: { schoolId }, orderBy: { id: "asc" }, select: { id: true } });
  if (!actor) return 0;

  await db.$transaction(
    rows.map((r) =>
      db.notification.create({
        data: { userId: r.userId, title: REMINDER_TITLE, body: reminderText(r) },
      }),
    ),
  );

  await db.auditLog.createMany({
    data: rows.map((r) => ({
      schoolId,
      userId: actor.id,
      action: "REMINDER",
      entity: "Invoice",
      entityId: r.invoiceId,
      details: { studentId: r.studentId, month: monthKey(r.periodStart), remaining: r.remaining },
    })),
  });

  return rows.length;
}

export async function reminderSummary(schoolId: number, month = monthStart(new Date())) {
  const rows = await reminderRows(schoolId, month);
  const unpaid = rows.filter((r) => r.remaining > 0);
  const dueAsOfToday = unpaid.filter((r) => r.isDueAsOfToday);
  return {
    month,
    rows,
    due: rows.reduce((s, r) => s + r.due, 0),
    paid: rows.reduce((s, r) => s + r.paid, 0),
    remaining: unpaid.reduce((s, r) => s + r.remaining, 0),
    upToDate: rows.filter((r) => r.status === "PAID").length,
    late: unpaid.filter((r) => r.daysLate > 0).length,
    missing: rows.filter((r) => r.status === "MISSING").length,
    // Conservé pour l'ancien bouton : hors « déjà relancé aujourd'hui ».
    sendable: unpaid.filter((r) => r.invoiceId !== null && r.userId !== null && !r.remindedToday).length,
    // Échéances atteintes à ce jour (le bouton reste cliquable le même jour :
    // allowRepeat, on ne filtre donc pas sur remindedToday ici).
    dueAsOfTodayCount: dueAsOfToday.length,
    dueAsOfTodayRemaining: dueAsOfToday.reduce((s, r) => s + r.remaining, 0),
    dueAsOfTodaySendable: dueAsOfToday.filter((r) => r.invoiceId !== null && r.userId !== null).length,
  };
}
