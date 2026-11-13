import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { updateGroup } from "../../actions";
import { GroupForm } from "../../group-form";

export const metadata: Metadata = { title: "Modifier le groupe" };

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { schoolId } = await requireRole("ADMIN");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const group = await db.group.findFirst({
    where: { id, schoolId },
    include: { sessions: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } },
  });
  if (!group) notFound();

  const [specialties, levels, teachers] = await Promise.all([
    db.specialty.findMany({ where: { schoolId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.level.findMany({ where: { schoolId }, orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.user.findMany({ where: { schoolId, role: "TEACHER", active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader title={`Modifier ${group.name}`} />
      <GroupForm
        specialties={specialties}
        levels={levels}
        teachers={teachers}
        action={updateGroup.bind(null, id)}
        defaults={{
          name: group.name,
          specialtyId: group.specialtyId,
          levelId: group.levelId,
          teacherId: group.teacherId,
          kind: group.kind,
          monthlyFee: Number(group.monthlyFee.toString()),
          capacity: group.capacity,
          sessions: group.sessions.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room,
          })),
        }}
        submitLabel="Enregistrer"
      />
    </>
  );
}
