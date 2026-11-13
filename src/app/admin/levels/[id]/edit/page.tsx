import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { updateLevel } from "../../actions";
import { LevelForm } from "../../level-form";

export const metadata: Metadata = { title: "Modifier le niveau" };

export default async function EditLevelPage({ params }: { params: Promise<{ id: string }> }) {
  const { schoolId } = await requireRole("ADMIN");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const level = await db.level.findFirst({ where: { id, schoolId } });
  if (!level) notFound();

  return (
    <>
      <PageHeader title={`Modifier ${level.name}`} />
      <LevelForm
        action={updateLevel.bind(null, id)}
        defaults={{ name: level.name, order: level.order }}
        submitLabel="Enregistrer"
      />
    </>
  );
}
