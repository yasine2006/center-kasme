import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { updateSpecialty } from "../../actions";
import { SpecialtyForm } from "../../specialty-form";

export const metadata: Metadata = { title: "Modifier la matière" };

export default async function EditSpecialtyPage({ params }: { params: Promise<{ id: string }> }) {
  const { schoolId } = await requireRole("ADMIN");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const specialty = await db.specialty.findFirst({ where: { id, schoolId } });
  if (!specialty) notFound();

  return (
    <>
      <PageHeader title={`Modifier ${specialty.name}`} />
      <SpecialtyForm
        action={updateSpecialty.bind(null, id)}
        defaults={{ name: specialty.name, color: specialty.color ?? "#2f6bff" }}
        submitLabel="Enregistrer"
      />
    </>
  );
}
