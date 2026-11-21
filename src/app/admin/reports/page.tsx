import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, CheckCircle, FileText, Users, CreditCard, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { buildDataset } from "@/lib/reports";
import { formatDate, formatDH, toInputDate } from "@/lib/format";
import { Card, PageHeader, td, th } from "@/components/ui";
import { ReportBuilder } from "./report-builder";

export const metadata: Metadata = { title: "Rapports & États Financiers" };

const TABS = [
  { key: "unpaid", label: "Élèves non payés (Impayés)", icon: AlertCircle, badge: "Prioritaire" },
  { key: "invoices", label: "État des factures", icon: CreditCard },
  { key: "students", label: "Liste des élèves", icon: Users },
  { key: "enrollments", label: "Inscriptions par groupe", icon: CheckCircle },
  { key: "receipts", label: "Reçus & Encaissements", icon: Receipt },
] as const;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { schoolId } = await requireRole("ADMIN");
  const { tab: tabParam } = await searchParams;
  const tab = TABS.find((t) => t.key === tabParam) ?? TABS[0];
  const today = new Date();
  const defaultAsOf = toInputDate(today);

  const [school, groups, preview, recent] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, logo: true } }),
    db.group.findMany({
      where: { schoolId, active: true },
      include: { specialty: true, level: true },
      orderBy: [{ specialty: { name: "asc" } }, { level: { name: "asc" } }, { name: "asc" }],
    }),
    buildDataset(
      schoolId,
      new URLSearchParams(
        tab.key === "unpaid" ? { type: tab.key, asOf: defaultAsOf, months: "1" } : { type: tab.key },
      ),
    ),
    tab.key === "receipts"
      ? db.payment.findMany({
          where: { invoice: { student: { schoolId } } },
          include: { invoice: { include: { student: true } } },
          orderBy: { paidAt: "desc" },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  const groupOptions = groups.map((g) => ({
    id: g.id,
    name: g.name,
    specialtyName: g.specialty.name,
    levelName: g.level.name,
  }));

  return (
    <>
      <PageHeader
        title="Centre de Rapports & États Financiers"
        subtitle="Suivi des impayés avec jours de retard, filtrage par groupe, situations à date et exports PDF / Excel professionnels"
      />

      <div className="mb-6 flex flex-wrap gap-1.5 rounded-xl border border-line bg-white p-1.5 shadow-xs">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === tab.key;
          return (
            <Link
              key={t.key}
              href={`/admin/reports?tab=${t.key}`}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-navy-950"
              }`}
            >
              <Icon size={16} className={isActive ? "text-amber-400" : "text-slate-400"} />
              <span>{t.label}</span>
              {"badge" in t && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-amber-400 text-navy-950" : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <ReportBuilder
        key={tab.key}
        type={tab.key}
        withCols={tab.key === "students"}
        firstCol="Nom complet de l'élève"
        schoolName={school.name}
        groups={groupOptions}
        defaultAsOf={defaultAsOf}
        initial={{
          title: preview.title,
          subtitle: preview.subtitle ?? null,
          head: preview.head,
          rows: preview.rows.slice(0, 20),
          total: preview.rows.length,
          money: preview.money,
          stats: preview.stats,
        }}
      />

      {tab.key === "receipts" && (
        <Card className="mt-8 overflow-hidden">
          <div className="p-5 pb-3">
            <h2 className="text-base font-bold text-navy-950">Derniers reçus encaissés</h2>
            <p className="mt-0.5 text-xs text-muted">Historique des 10 derniers règlements enregistrés dans le système.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-y border-line bg-slate-50/80">
                <tr>
                  <th className={th}>N° reçu</th>
                  <th className={th}>Date encaissement</th>
                  <th className={th}>Élève</th>
                  <th className={th}>Montant</th>
                  <th className={`${th} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className={`${td} font-bold text-navy-900`}>{p.receiptNo ?? `#${p.id}`}</td>
                    <td className={td}>{formatDate(p.paidAt)}</td>
                    <td className={`${td} font-medium`}>
                      {p.invoice.student.firstName} {p.invoice.student.lastName}
                    </td>
                    <td className={`${td} font-bold text-emerald-700`}>{formatDH(Number(p.amount.toString()))}</td>
                    <td className={`${td} text-right`}>
                      <a
                        href={`/api/receipts/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-800 transition"
                      >
                        <FileText size={13} /> Reçu PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
