import type { Metadata } from "next";
import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileWarning,
  Filter,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/session";
import { firstOfMonth, statusMeta } from "@/lib/fees";
import { monthKey, parseMonthKey } from "@/lib/invoicing";
import { reminderRows, reminderSummary } from "@/lib/reminders";
import { formatDate, formatDH, formatMonth } from "@/lib/format";
import { AutoForm } from "@/components/auto-form";
import { Avatar, Badge, btnGhost, btnPrimary, Card, PageHeader, selectCls, td, th } from "@/components/ui";
import { generateMonthlyInvoices } from "../invoices/actions";
import { remindAll, remindDueToday, remindStudent } from "./actions";

export const metadata: Metadata = { title: "Relances & impayés" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const fmtDay = (d: Date | null) => (d ? formatDate(d) : "—");

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; sent?: string; filter?: string }>;
}) {
  const { schoolId } = await requireRole("ADMIN");
  const sp = await searchParams;
  const month = parseMonthKey(sp.month ?? "") ?? firstOfMonth();
  const key = monthKey(month);
  const previous = firstOfMonth(month, -1);
  const now = new Date();
  const isCurrentMonth = monthKey(month) === monthKey(now);
  const todayDay = now.getUTCDate();
  const daysInMonth = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const dayLimit = isCurrentMonth ? todayDay : month.getTime() < now.getTime() ? daysInMonth : 0;
  const currentFilter = sp.filter ?? "due_today";
  const sent = Number(sp.sent ?? 0);

  const [s, previousRows] = await Promise.all([reminderSummary(schoolId, month), reminderRows(schoolId, previous)]);

  const monthLast = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  const unpaidExport = `/api/reports?type=invoices&format=xlsx&unpaid=1&from=${key}-01&to=${monthLast}`;

  const rows = [...s.rows].sort((a, b) => {
    const aPaid = a.status === "PAID" ? 1 : 0;
    const bPaid = b.status === "PAID" ? 1 : 0;
    if (aPaid !== bPaid) return aPaid - bPaid;
    return b.remaining - a.remaining;
  });

  const displayedRows = rows.filter((r) => {
    if (currentFilter === "late") return r.remaining > 0 && r.daysLate > 0;
    if (currentFilter === "all") return true;
    return r.remaining > 0 && r.isDueAsOfToday; // due_today (défaut)
  });

  // Ancien bouton : mois affiché + mois précédent, avec facture, compte et retard.
  const relaunchable = [...rows, ...previousRows].filter(
    (r) => r.invoiceId !== null && r.userId !== null && r.remaining > 0 && r.daysLate > 0,
  ).length;

  const filters = [
    {
      id: "due_today",
      href: `?month=${key}&filter=due_today`,
      icon: Clock,
      label: `Échéances à ce jour (1 au ${dayLimit})`,
      count: s.dueAsOfTodayCount,
    },
    { id: "all", href: `?month=${key}&filter=all`, icon: Users, label: "Tous les élèves", count: rows.length },
    { id: "late", href: `?month=${key}&filter=late`, icon: Filter, label: "En retard strict", count: s.late },
  ];

  const filterHelp =
    currentFilter === "late"
      ? "Filtre actif : seuls les impayés en retard d'au moins 1 jour sont affichés."
      : currentFilter === "all"
        ? "Filtre actif : tous les élèves du mois sélectionné, y compris ceux à jour."
        : `Filtre actif : impayés dont l'échéance mensuelle est atteinte du 1er au ${dayLimit} du mois.`;

  return (
    <>
      <PageHeader
        title="Relances & impayés"
        subtitle={
          <>
            Suivi des paiements de <b className="capitalize text-ink">{formatMonth(month)}</b> — {s.upToDate} élève(s) à
            jour, {s.dueAsOfTodayCount} échu(s) à ce jour (1 au {dayLimit})
          </>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AutoForm>
              <input type="month" name="month" defaultValue={key} className={selectCls} aria-label="Mois" />
            </AutoForm>
            {s.dueAsOfTodaySendable > 0 && (
              <form action={remindDueToday.bind(null, key)}>
                <button
                  className={btnPrimary}
                  title={`Relancer uniquement les impayés du 1er au ${dayLimit} ${formatMonth(month)} (uniquement ce mois)`}
                >
                  <CalendarClock size={15} /> Relancer échéances du jour ({s.dueAsOfTodaySendable})
                </button>
              </form>
            )}
            {relaunchable > 0 && (
              <form action={remindAll.bind(null, key)}>
                <button className={btnGhost} title="Mois affiché + mois précédent">
                  <BellRing size={15} /> Tous les retardataires ({relaunchable})
                </button>
              </form>
            )}
            {s.missing > 0 && (
              <form action={generateMonthlyInvoices}>
                <button className={btnGhost}>
                  <FileWarning size={15} /> Factures manquantes ({s.missing})
                </button>
              </form>
            )}
            <a href={unpaidExport} className={btnGhost}>
              <FileSpreadsheet size={15} /> Impayés Excel
            </a>
          </div>
        }
      />

      {sent > 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> {sent} rappel(s) envoyé(s) en notification.
        </p>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Encaissé sur ces cycles", value: formatDH(s.paid), hint: `sur ${formatDH(s.due)}`, tone: "text-emerald-600" },
          { label: "Reste à encaisser", value: formatDH(s.remaining), hint: `${s.rows.filter((r) => r.remaining > 0).length} élève(s)`, tone: "text-rose-600" },
          { label: "À jour", value: String(s.upToDate), hint: "factures soldées", tone: "text-emerald-600" },
          {
            label: `Échus à ce jour (1 au ${dayLimit})`,
            value: formatDH(s.dueAsOfTodayRemaining),
            hint: `${s.dueAsOfTodayCount} élève(s)`,
            tone: "text-amber-600",
          },
        ].map((c) => (
          <Card key={c.label} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.tone}`}>{c.value}</p>
            <p className="text-xs text-muted">{c.hint}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const Icon = f.icon;
            const active = currentFilter === f.id;
            return (
              <Link
                key={f.id}
                href={f.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  active ? "bg-brand-600 text-white" : "border border-line bg-white text-ink hover:bg-slate-50"
                }`}
              >
                <Icon size={14} /> {f.label}
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] ${active ? "bg-white/20 text-white" : "bg-slate-100 text-muted"}`}
                >
                  {f.count}
                </span>
              </Link>
            );
          })}
        </div>
        <p className="text-xs text-muted">{filterHelp}</p>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-line bg-slate-50/70">
              <tr>
                <th className={th}>Élève</th>
                <th className={th}>Échéance mensuelle</th>
                <th className={th}>Statut</th>
                <th className={`${th} text-right`}>Dû</th>
                <th className={`${th} text-right`}>Reste</th>
                <th className={th}>Retard</th>
                <th className={th}>Dernier rappel</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {displayedRows.map((r) => {
                const meta = r.status === "MISSING" ? null : statusMeta[r.status];
                const full = `${r.firstName} ${r.lastName}`;
                return (
                  <tr key={r.studentId} className="transition hover:bg-slate-50/60">
                    <td className={td}>
                      <span className="flex items-center gap-2.5 font-medium">
                        <Avatar name={full} size={30} />
                        <span>
                          <Link href={`/admin/students/${r.studentId}`} className="hover:text-brand-600">
                            {full}
                          </Link>
                          <span className="block text-xs font-normal text-muted">
                            {r.parentName ?? "—"}
                            {r.phone ? ` · ${r.phone}` : ""}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className={td}>
                      <span className="whitespace-nowrap">{fmtDay(r.dueDate)}</span>
                      {r.enrollmentStart && (
                        <span className="block text-xs text-muted">Inscrit le {fmtDay(r.enrollmentStart)}</span>
                      )}
                    </td>
                    <td className={td}>
                      {meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : <Badge tone="gray">Sans facture</Badge>}
                    </td>
                    <td className={`${td} text-right`}>{formatDH(r.due)}</td>
                    <td className={`${td} text-right font-medium`}>{r.remaining > 0 ? formatDH(r.remaining) : "—"}</td>
                    <td className={td}>
                      {r.remaining > 0 ? (
                        r.daysLate > 0 ? (
                          <span className="text-xs font-medium text-rose-600">{r.daysLate} j</span>
                        ) : r.isDueAsOfToday ? (
                          <span className="text-xs font-medium text-amber-600">Échéance aujourd&apos;hui</span>
                        ) : (
                          <span className="text-xs text-muted">Échéance le {fmtDay(r.dueDate)}</span>
                        )
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className={td}>
                      {r.remindedToday ? (
                        <span className="text-xs font-medium text-emerald-600">Aujourd&apos;hui</span>
                      ) : r.remindedAt ? (
                        <span className="text-xs text-muted">{formatDate(r.remindedAt)}</span>
                      ) : (
                        <span className="text-xs text-muted">Jamais</span>
                      )}
                    </td>
                    <td className={td}>
                      <div className="flex items-center justify-end gap-2">
                        {r.status === "MISSING" ? (
                          <Link href={`/admin/students/${r.studentId}`} className="text-xs font-medium text-brand-600 hover:underline">
                            Voir la fiche
                          </Link>
                        ) : (
                          <>
                            {r.remaining > 0 && r.userId && (
                              <form action={remindStudent.bind(null, r.studentId, key)}>
                                <button
                                  disabled={r.remindedToday}
                                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                                  title={r.remindedToday ? "Déjà relancé aujourd'hui" : "Envoyer une notification"}
                                >
                                  <Send size={13} /> {r.remindedToday ? "Relancé" : "Notifier"}
                                </button>
                              </form>
                            )}
                            {r.remaining > 0 && !r.userId && (
                              <span className="text-xs text-muted" title="Aucun compte de connexion pour cet élève">
                                Pas de compte
                              </span>
                            )}
                            {r.waHref && r.remaining > 0 && (
                              <a
                                href={r.waHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                                title={`WhatsApp ${r.parentName ?? ""}`}
                              >
                                <MessageCircle size={13} /> WhatsApp
                              </a>
                            )}
                            {r.invoiceId && (
                              <Link
                                href={`/admin/invoices/${r.invoiceId}`}
                                className="text-xs font-medium text-brand-600 hover:underline"
                              >
                                Encaisser
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!displayedRows.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
                    Aucune ligne pour ce filtre sur {formatMonth(month)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-4 text-xs text-muted">
        Les rappels consistent en une <b>notification in-app</b> (élèves avec compte) et en un <b>lien WhatsApp</b>{" "}
        <code>wa.me</code> à ouvrir manuellement pour le parent — aucun message n&apos;est envoyé automatiquement. Le cycle
        suit le <b>jour d&apos;inscription</b> (anniversaire mensuel, ramené au dernier jour du mois si celui-ci est plus
        court) et le retard repart de 0 à chaque nouveau mois. Le bouton <b>Relancer échéances du jour</b> cible uniquement
        le mois affiché, du 1er au {dayLimit} ; <b>Tous les retardataires</b> couvre aussi le mois précédent.
      </p>
    </>
  );
}
