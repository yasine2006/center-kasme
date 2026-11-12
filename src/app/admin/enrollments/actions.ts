"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ensureCurrentInvoice } from "@/lib/invoicing";
import { requireRole } from "@/lib/session";

const schema = z.object({
  studentId: z.coerce.number().int().positive("Élève requis"),
  groupId: z.coerce.number().int().positive("Groupe requis"),
});

export type EnrollFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
  ok?: boolean;
  /** Invoice of the cycle that just started, so the admin can cash it right away. */
  invoiceId?: number | null;
};

export async function createEnrollment(_: EnrollFormState, formData: FormData): Promise<EnrollFormState> {
  const session = await requireRole("ADMIN");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  const d = parsed.data;

  const [student, group] = await Promise.all([
    db.student.findFirst({ where: { id: d.studentId, schoolId: session.schoolId } }),
    db.group.findFirst({ where: { id: d.groupId, schoolId: session.schoolId } }),
  ]);
  if (!student || !group) return { message: "Élève ou groupe introuvable." };

  const existing = await db.enrollment.findUnique({ where: { studentId_groupId: { studentId: student.id, groupId: group.id } } });
  if (existing) {
    if (existing.status === "STOPPED") {
      await db.enrollment.update({ where: { id: existing.id }, data: { status: "ACTIVE", stoppedAt: null, monthlyFee: group.monthlyFee } });
    } else {
      return { errors: { groupId: ["Cet élève est déjà inscrit dans ce groupe"] } };
    }
  } else {
    await db.enrollment.create({ data: { studentId: student.id, groupId: group.id, monthlyFee: group.monthlyFee } });
  }

  // Bill the running cycle immediately instead of waiting for the daily cron.
  // A failure here must not lose the enrollment: the cron will retry later.
  let invoiceId: number | null = null;
  try {
    invoiceId = (await ensureCurrentInvoice(student.id))?.id ?? null;
  } catch (error) {
    console.error("ensureCurrentInvoice failed after enrollment", error);
  }

  await audit(session, "CREATE", "Enrollment", student.id, { groupId: group.id, invoiceId });
  revalidatePath("/admin", "layout");
  return { ok: true, invoiceId };
}

export async function stopEnrollment(id: number) {
  const session = await requireRole("ADMIN");
  const e = await db.enrollment.findFirst({ where: { id, student: { schoolId: session.schoolId } } });
  if (!e) return;

  await db.enrollment.update({ where: { id }, data: { status: "STOPPED", stoppedAt: new Date() } });
  await audit(session, "UPDATE", "Enrollment", id, { status: "STOPPED" });
  revalidatePath("/admin", "layout");
}

export async function reactivateEnrollment(id: number) {
  const session = await requireRole("ADMIN");
  const e = await db.enrollment.findFirst({ where: { id, student: { schoolId: session.schoolId } } });
  if (!e) return;

  await db.enrollment.update({ where: { id }, data: { status: "ACTIVE", stoppedAt: null } });
  try {
    await ensureCurrentInvoice(e.studentId);
  } catch (error) {
    console.error("ensureCurrentInvoice failed after reactivation", error);
  }
  await audit(session, "UPDATE", "Enrollment", id, { status: "ACTIVE" });
  revalidatePath("/admin", "layout");
}

export async function deleteEnrollment(id: number) {
  const session = await requireRole("ADMIN");
  const e = await db.enrollment.findFirst({ where: { id, student: { schoolId: session.schoolId } }, include: { _count: { select: { lines: true } } } });
  if (!e || e._count.lines > 0) return; // keep enrollments already billed

  await db.enrollment.delete({ where: { id } });
  await audit(session, "DELETE", "Enrollment", id);
  revalidatePath("/admin", "layout");
}
