import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { monthlyDueDate } from "@/lib/late-days";

export const MAX_BILLING_MONTHS = 12;

export type EnrollmentForBilling = {
  id: number;
  startedAt: Date;
  monthlyFee: Prisma.Decimal;
  group: { name: string };
};

/**
 * One billing cycle for one student.
 * - `start` is the enrollment day (clamped for short months).
 * - `end` is the start of the next cycle (exclusive).
 * - `dueDate` = anniversaire mensuel de l'inscription (= `start`).
 */
export type BillingCycle = {
  index: number;
  month: Date; // 1st of the month containing `start` — used for the DB unique key
  start: Date;
  end: Date;
  dueDate: Date;
};

export const monthStart = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
export const monthKey = (d: Date) => d.toISOString().slice(0, 7);
export const parseMonthKey = (key: string) => (/^\d{4}-\d{2}$/.test(key) ? new Date(`${key}-01T00:00:00.000Z`) : null);

/** Adds `n` months, keeping the day-of-month and clamping to the target month's last day. */
export function addMonthsClamped(date: Date, n: number) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + n;
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

/** The student's billing anchor: the date (midnight UTC) of their very first enrollment. */
export const billingAnchor = <T extends { startedAt: Date }>(enrollments: T[]) => {
  const min = enrollments.reduce<Date | null>((m, e) => (m === null || e.startedAt < m ? e.startedAt : m), null);
  if (!min) return null;
  return new Date(Date.UTC(min.getUTCFullYear(), min.getUTCMonth(), min.getUTCDate()));
};

/** Cycle number `index` for a student anchored on `anchor` (index 0 = first cycle). */
export function cycleAt(anchor: Date, index: number): BillingCycle {
  const start = addMonthsClamped(anchor, index);
  const end = addMonthsClamped(anchor, index + 1);
  const dueMonth = monthStart(start);
  return { index, month: dueMonth, start, end, dueDate: monthlyDueDate(anchor, dueMonth) };
}

/** Index of the cycle that contains `date` for a student anchored on `anchor`. */
export function cycleIndexForDate(anchor: Date, date: Date) {
  let index = (date.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (date.getUTCMonth() - anchor.getUTCMonth());
  if (date.getTime() < addMonthsClamped(anchor, index).getTime()) index -= 1;
  return index;
}

export const cycleForDate = (anchor: Date, date: Date) => cycleAt(anchor, cycleIndexForDate(anchor, date));

/** Cycle that starts in the calendar month `month` (1st of month). */
export function cycleForMonth(anchor: Date, month: Date) {
  const index = (month.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (month.getUTCMonth() - anchor.getUTCMonth());
  return cycleAt(anchor, index);
}

/** Enrollments that exist before the end of the cycle are billed in full (no proration). */
export const enrollmentsBillableFor = <T extends { startedAt: Date }>(enrollments: T[], periodEnd: Date) =>
  enrollments.filter((e) => e.startedAt.getTime() < periodEnd.getTime());

export const expectedDue = (enrollments: EnrollmentForBilling[], cycle: BillingCycle) =>
  enrollmentsBillableFor(enrollments, cycle.end).reduce(
    (sum, e) => sum.plus(new Prisma.Decimal(e.monthlyFee.toString())),
    new Prisma.Decimal(0),
  );

type Tx = Prisma.TransactionClient;

export async function ensureInvoiceForCycle(
  tx: Tx,
  studentId: number,
  cycle: BillingCycle,
  enrollments: EnrollmentForBilling[],
) {
  const existing = await tx.invoice.findUnique({ where: { studentId_month: { studentId, month: cycle.month } } });
  if (existing) return existing;

  const active = enrollmentsBillableFor(enrollments, cycle.end);
  if (!active.length) return null;

  return tx.invoice
    .create({
      data: {
        studentId,
        month: cycle.month,
        periodStart: cycle.start,
        periodEnd: cycle.end,
        // Échéance = monthlyDueDate(ancre d'inscription, cycle.month), calculée dans cycleAt().
        dueDate: cycle.dueDate,
        lines: { create: active.map((e) => ({ enrollmentId: e.id, label: e.group.name, amount: e.monthlyFee })) },
      },
    })
    .catch(async (error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return tx.invoice.findUnique({ where: { studentId_month: { studentId, month: cycle.month } } });
      }
      throw error;
    });
}

/**
 * Creates (if needed) the invoice for the cycle that is running right now for
 * one student. Called immediately after an enrollment so the admin can cash the
 * period without waiting for the daily cron.
 */
export async function ensureCurrentInvoice(studentId: number, now = new Date()) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: {
      enrollments: {
        select: { id: true, status: true, startedAt: true, monthlyFee: true, group: { select: { name: true } } },
      },
    },
  });
  if (!student) return null;

  const anchor = billingAnchor(student.enrollments);
  if (!anchor) return null;

  const active = student.enrollments.filter((e) => e.status === "ACTIVE");
  if (!active.length) return null;

  const cycle = cycleForDate(anchor, now);
  return db.$transaction((tx) => ensureInvoiceForCycle(tx, studentId, cycle, active), {
    maxWait: 5000,
    timeout: 15000,
  });
}

type Planned = { studentId: number; cycle: BillingCycle; enrollments: EnrollmentForBilling[] };

async function planMissing(schoolId: number | undefined, upTo: Date): Promise<Planned[]> {
  const earliestMonth = addMonthsClamped(monthStart(upTo), -(MAX_BILLING_MONTHS - 1));

  const students = await db.student.findMany({
    where: {
      ...(schoolId ? { schoolId } : {}),
      archived: false,
      status: "ACTIVE",
      enrollments: { some: { status: "ACTIVE" } },
    },
    select: {
      id: true,
      enrollments: {
        select: { id: true, status: true, startedAt: true, monthlyFee: true, group: { select: { name: true } } },
      },
    },
  });
  if (!students.length) return [];

  const existing = await db.invoice.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, month: { gte: earliestMonth } },
    select: { studentId: true, month: true },
  });
  const taken = new Set(existing.map((i) => `${i.studentId}:${monthKey(i.month)}`));

  const plan: Planned[] = [];
  for (const s of students) {
    const anchor = billingAnchor(s.enrollments);
    if (!anchor) continue;

    const active = s.enrollments.filter((e) => e.status === "ACTIVE");
    if (!active.length) continue;

    const currentIndex = cycleIndexForDate(anchor, upTo);
    const firstIndex = Math.max(0, currentIndex - (MAX_BILLING_MONTHS - 1));
    for (let index = firstIndex; index <= currentIndex; index++) {
      const cycle = cycleAt(anchor, index);
      if (taken.has(`${s.id}:${monthKey(cycle.month)}`)) continue;
      if (!enrollmentsBillableFor(active, cycle.end).length) continue;
      plan.push({ studentId: s.id, cycle, enrollments: active });
    }
  }
  return plan;
}

/**
 * Cheap badge count for the invoices page. Uses the same bounded window and
 * the same cycle/billable rules as planMissing(), so the number matches what
 * generateMissingInvoices() will create, but skips building the full plan and
 * loading fields (fees, group labels) that a count does not need.
 */
export async function countMissingInvoices(schoolId: number, upTo = new Date()) {
  const earliestMonth = addMonthsClamped(monthStart(upTo), -(MAX_BILLING_MONTHS - 1));

  const students = await db.student.findMany({
    where: {
      schoolId,
      archived: false,
      status: "ACTIVE",
      enrollments: { some: { status: "ACTIVE" } },
    },
    select: { id: true, enrollments: { select: { status: true, startedAt: true } } },
  });
  if (!students.length) return 0;

  const existing = await db.invoice.findMany({
    where: { studentId: { in: students.map((s) => s.id) }, month: { gte: earliestMonth } },
    select: { studentId: true, month: true },
  });
  const taken = new Set(existing.map((i) => `${i.studentId}:${monthKey(i.month)}`));

  let count = 0;
  for (const s of students) {
    const anchor = billingAnchor(s.enrollments);
    if (!anchor) continue;

    const active = s.enrollments.filter((e) => e.status === "ACTIVE");
    if (!active.length) continue;

    const currentIndex = cycleIndexForDate(anchor, upTo);
    const firstIndex = Math.max(0, currentIndex - (MAX_BILLING_MONTHS - 1));
    for (let index = firstIndex; index <= currentIndex; index++) {
      const cycle = cycleAt(anchor, index);
      if (taken.has(`${s.id}:${monthKey(cycle.month)}`)) continue;
      if (!enrollmentsBillableFor(active, cycle.end).length) continue;
      count++;
    }
  }
  return count;
}

export async function generateMissingInvoices(schoolId?: number, upTo = new Date()) {
  const plan = await planMissing(schoolId, upTo);
  if (!plan.length) return 0;

  let created = 0;
  await db.$transaction(
    async (tx) => {
      for (const item of plan) {
        const invoice = await ensureInvoiceForCycle(tx, item.studentId, item.cycle, item.enrollments);
        if (invoice) created++;
      }
    },
    { maxWait: 5000, timeout: 60_000 },
  );
  return created;
}
