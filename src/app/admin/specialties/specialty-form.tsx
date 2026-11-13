"use client";

import { useActionState, useEffect, useRef } from "react";
import { btnPrimary, Card, Field, inputCls } from "@/components/ui";
import { createSpecialty, type SpecialtyFormState } from "./actions";

type Props = {
  action?: (state: SpecialtyFormState, formData: FormData) => Promise<SpecialtyFormState>;
  defaults?: { name?: string; color?: string };
  submitLabel?: string;
};

export function SpecialtyForm({ action, defaults = {}, submitLabel = "Ajouter" }: Props) {
  const fn = action ?? createSpecialty;
  const [state, formAction, pending] = useActionState<SpecialtyFormState, FormData>(fn, {});
  const ref = useRef<HTMLFormElement>(null);
  const e = (k: string) => state.errors?.[k]?.[0];

  useEffect(() => {
    if (state.ok && !action) ref.current?.reset();
  }, [state, action]);

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">{action ? "Modifier la matière" : "Nouvelle matière"}</h2>
      <form ref={ref} action={formAction} className="space-y-4">
        <Field label="Nom" error={e("name")}>
          <input name="name" defaultValue={defaults.name ?? ""} placeholder="ex. Mathématiques" className={inputCls} />
        </Field>
        <Field label="Couleur" error={e("color")}>
          <input name="color" type="color" defaultValue={defaults.color ?? "#2f6bff"} className="h-10 w-20 cursor-pointer rounded-lg border border-line bg-white p-1" />
        </Field>
        {state.ok && <p className="text-sm text-emerald-600">{action ? "Matière mise à jour." : "Matière ajoutée."}</p>}
        <button disabled={pending} className={`${btnPrimary} w-full`}>
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </form>
    </Card>
  );
}
