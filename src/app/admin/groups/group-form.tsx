"use client";

import { useActionState, useEffect, useRef } from "react";
import { btnPrimary, Card, Field, inputCls } from "@/components/ui";
import { createGroup, type GroupFormState } from "./actions";

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

type SessionDefault = { dayOfWeek: number; startTime: string; endTime: string; room?: string | null };

type Props = {
  specialties: { id: number; name: string }[];
  levels: { id: number; name: string }[];
  teachers: { id: number; name: string }[];
  action?: (state: GroupFormState, formData: FormData) => Promise<GroupFormState>;
  defaults?: {
    name?: string;
    specialtyId?: number;
    levelId?: number;
    teacherId?: number | null;
    kind?: string;
    monthlyFee?: number;
    capacity?: number | null;
    sessions?: SessionDefault[];
  };
  submitLabel?: string;
};

export function GroupForm({ specialties, levels, teachers, action, defaults = {}, submitLabel = "Créer le groupe" }: Props) {
  const fn = action ?? createGroup;
  const [state, formAction, pending] = useActionState<GroupFormState, FormData>(fn, {});
  const ref = useRef<HTMLFormElement>(null);
  const e = (k: string) => state.errors?.[k]?.[0];

  useEffect(() => {
    if (state.ok && !action) ref.current?.reset();
  }, [state, action]);

  const sessions = defaults.sessions ?? [];

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">{action ? "Modifier le groupe" : "Nouveau groupe"}</h2>
      <form ref={ref} action={formAction} className="space-y-4">
        <Field label="Nom du groupe" error={e("name")}>
          <input name="name" defaultValue={defaults.name ?? ""} placeholder="ex. Maths · Collège" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Matière">
            <select name="specialtyId" defaultValue={defaults.specialtyId ?? specialties[0]?.id ?? ""} className={inputCls}>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Niveau">
            <select name="levelId" defaultValue={defaults.levelId ?? levels[0]?.id ?? ""} className={inputCls}>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Enseignant">
          <select name="teacherId" defaultValue={defaults.teacherId ?? ""} className={inputCls}>
            <option value="">— Aucun —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select name="kind" defaultValue={defaults.kind ?? "REGULAR"} className={inputCls}>
              <option value="REGULAR">Soutien</option>
              <option value="CONCOURS">Concours</option>
            </select>
          </Field>
          <Field label="Mensualité (DH)" error={e("monthlyFee")}>
            <input name="monthlyFee" type="number" min="1" step="1" defaultValue={defaults.monthlyFee ?? ""} placeholder="450" className={inputCls} />
          </Field>
        </div>
        <Field label="Capacité max (optionnel)">
          <input name="capacity" type="number" min="1" step="1" defaultValue={defaults.capacity ?? ""} placeholder="18" className={inputCls} />
        </Field>

        <div className="space-y-2 border-t border-line pt-4">
          <p className="text-sm font-medium">Créneaux hebdomadaires (emploi du temps, optionnel)</p>
          {[0, 1, 2].map((i) => {
            const s = sessions[i];
            return (
              <div key={i} className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-2">
                <select name={`day_${i}`} defaultValue={s?.dayOfWeek ?? (i === 0 ? 1 : "")} className={inputCls} aria-label="Jour">
                  <option value="">— Jour —</option>
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <input name={`start_${i}`} type="time" defaultValue={s?.startTime ?? ""} className={inputCls} aria-label="Début" />
                <input name={`end_${i}`} type="time" defaultValue={s?.endTime ?? ""} className={inputCls} aria-label="Fin" />
                <input name={`room_${i}`} type="text" defaultValue={s?.room ?? ""} placeholder="Salle" className={inputCls} aria-label="Salle" />
              </div>
            );
          })}
        </div>

        {state.ok && <p className="text-sm text-emerald-600">{action ? "Groupe mis à jour." : "Groupe créé."}</p>}
        <button disabled={pending} className={`${btnPrimary} w-full`}>
          {pending ? "Enregistrement…" : submitLabel}
        </button>
      </form>
    </Card>
  );
}
