"use client";

import { useActionState, useEffect, useRef } from "react";
import { btnPrimary, Card, Field, inputCls } from "@/components/ui";
import { createLevel, type LevelFormState } from "./actions";

type Props = {
  action?: (state: LevelFormState, formData: FormData) => Promise<LevelFormState>;
  defaults?: { name?: string; order?: number };
  submitLabel?: string;
};

export function LevelForm({ action, defaults = {}, submitLabel = "Ajouter" }: Props) {
  const fn = action ?? createLevel;
  const [state, formAction, pending] = useActionState<LevelFormState, FormData>(fn, {});
  const ref = useRef<HTMLFormElement>(null);
  const e = (k: string) => state.errors?.[k]?.[0];

  useEffect(() => {
    if (state.ok && !action) ref.current?.reset();
  }, [state, action]);

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">{action ? "Modifier le niveau" : "Nouveau niveau"}</h2>
      <form ref={ref} action={formAction} className="space-y-4">
        <Field label="Nom" error={e("name")}>
          <input name="name" defaultValue={defaults.name ?? ""} placeholder="ex. Collège" className={inputCls} />
        </Field>
        <Field label="Ordre d'affichage" error={e("order")}>
          <input name="order" type="number" min="0" step="1" defaultValue={defaults.order ?? 0} className={inputCls} />
        </Field>
        {state.ok && <p className="text-sm text-emerald-600">{action ? "Niveau mis à jour." : "Niveau ajouté."}</p>}
        <button disabled={pending} className={`${btnPrimary} w-full`}>
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </form>
    </Card>
  );
}
