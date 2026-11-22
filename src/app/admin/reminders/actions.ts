"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/session";
import { firstOfMonth } from "@/lib/fees";
import { monthKey, parseMonthKey } from "@/lib/invoicing";
import { sendReminders } from "@/lib/reminders";

export async function remindStudent(studentId: number, key: string) {
  const session = await requireRole("ADMIN");
  const month = parseMonthKey(key);
  if (!month) return;

  const sent = await sendReminders(session.schoolId, month, { studentIds: [studentId] });
  revalidatePath("/admin", "layout");
  redirect(`/admin/reminders?month=${monthKey(month)}&sent=${sent}`);
}

/** Ancien bouton « Tous les retardataires » : mois affiché + mois précédent. */
export async function remindAll(key: string) {
  const session = await requireRole("ADMIN");
  const month = parseMonthKey(key);
  if (!month) return;

  const previous = firstOfMonth(month, -1);
  const [currentSent, previousSent] = await Promise.all([
    sendReminders(session.schoolId, month, { onlyOverdue: true, allowRepeat: true }),
    sendReminders(session.schoolId, previous, { onlyOverdue: true, allowRepeat: true }),
  ]);
  revalidatePath("/admin", "layout");
  redirect(`/admin/reminders?month=${monthKey(month)}&sent=${currentSent + previousSent}`);
}

/**
 * Relance uniquement les élèves dont l'échéance mensuelle est atteinte jusqu'à
 * aujourd'hui, uniquement dans le mois sélectionné (« gha f dak chher »).
 */
export async function remindDueToday(key: string) {
  const session = await requireRole("ADMIN");
  const month = parseMonthKey(key);
  if (!month) return;

  const sent = await sendReminders(session.schoolId, month, {
    onlyDueAsOfToday: true,
    allowRepeat: true,
  });
  revalidatePath("/admin", "layout");
  redirect(`/admin/reminders?month=${monthKey(month)}&filter=due_today&sent=${sent}`);
}
