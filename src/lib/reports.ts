import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { studentSearchWhere } from "@/lib/search";
import { invoiceStatus, invoiceTotals, statusMeta } from "@/lib/fees";
import { formatDate, formatPeriod } from "@/lib/format";

export type DatasetStats = {
  totalCount: number;
  totalDue?: number;
  totalPaid?: number;
  totalRemaining?: number;
  totalLateCount?: number;
};

export type Dataset = {
  title: string;
  subtitle?: string;
  head: string[];
  rows: (string | number)[][];
  /** column indexes holding money amounts (formatted as DH in PDF, kept numeric in Excel) */
  money: number[];
  slug: string;
  stats?: DatasetStats;
};

const parseDay = (v: string | null, end = false) =>
  v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T${end ? "23:59:59.999" : "00:00:00.000"}Z`) : undefined;

const range = (from?: Date, to?: Date) => (from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined);

const periodLabel = (sp: URLSearchParams) => {
  const f = sp.get("from");
  const t = sp.get("to") || sp.get("asOf");
  return f || t ? `Période : ${f ? formatDate(`${f}T00:00:00Z`) : "Historique"} → ${t ? formatDate(`${t}T00:00:00Z`) : "Aujourd'hui"}` : undefined;
};

const methodLabel = (m: string) => (m === "CASH" ? "Espèces" : "Virement");

export async function buildDataset(schoolId: number, sp: URLSearchParams): Promise<Dataset> {
  const type = sp.get("type") ?? "unpaid";
  const from = parseDay(sp.get("from"));
  const to = parseDay(sp.get("to"), true);
  const q = sp.get("q")?.trim() || undefined;
  const groupId = Number(sp.get("groupId")) || undefined;
  const specialtyId = Number(sp.get("specialtyId")) || undefined;
  const DAY = 86_400_000;
  const now = new Date();

  /**
   * Defensive guard against corrupted/legacy due dates.
   * An invoice can never be due before its cycle starts + 5 days. This prevents
   * the "enrolled 19/11 → 16 days late since 05/11" style bug even if a stored
   * dueDate was ever written with a hardcoded 5th-of-the-month value.
   */
  const effectiveDueFor = (invoice: { dueDate: Date; periodStart: Date }) => {
    const floor = new Date(invoice.periodStart.getTime() + 5 * DAY);
    return invoice.dueDate.getTime() > floor.getTime() ? invoice.dueDate : floor;
  };

  // Find group name for subtitles if filtered
  let groupName: string | undefined;
  if (groupId) {
    const grp = await db.group.findUnique({
      where: { id: groupId },
      select: { name: true, specialty: { select: { name: true } }, level: { select: { name: true } } },
    });
    if (grp) {
      groupName = `${grp.specialty.name} - ${grp.name} (${grp.level.name})`;
    }
  }

  const studentWhere: Prisma.StudentWhereInput = {
    schoolId,
    archived: false,
    ...(await studentSearchWhere(q, schoolId)),
    ...(groupId || specialtyId
      ? { enrollments: { some: { ...(groupId ? { groupId } : {}), ...(specialtyId ? { group: { specialtyId } } : {}) } } }
      : {}),
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. ÉLÈVES NON PAYÉS (IMPAYÉS À DATE - CUMULATIF HISTORIQUE)
  // ───────────────────────────────────────────────────────────────────────────
  if (type === "unpaid") {
    // Cutoff date: any invoice starting on or before this date is included.
    const rawCutoff = sp.get("asOf") || sp.get("to");
    const cutoffDate = rawCutoff ? parseDay(rawCutoff, true) ?? now : now;
    const onlyLate = sp.get("onlyLate") === "1";

    // Monthly window driven by the selected date (fully filterable):
    //   "1"   → cycles starting in the selected month, up to the selected date (default)
    //   "2"   → cycles starting in the selected month OR the one before, up to the selected date
    //   "all" → cumulative history up to the selected date (legacy behaviour)
    const months = sp.get("months") ?? "1";
    const selectedFirst = new Date(Date.UTC(cutoffDate.getUTCFullYear(), cutoffDate.getUTCMonth(), 1));
    const minStart =
      months === "all"
        ? undefined
        : months === "2"
          ? new Date(Date.UTC(cutoffDate.getUTCFullYear(), cutoffDate.getUTCMonth() - 1, 1))
          : selectedFirst;
    const lowerBound = from ?? minStart;

    const groupInvoiceFilter = groupId
      ? {
          OR: [
            { lines: { some: { enrollment: { groupId } } } },
            { student: { enrollments: { some: { groupId } } } },
          ],
        }
      : {};

    const invoices = await db.invoice.findMany({
      where: {
        student: {
          schoolId,
          archived: false,
          ...(await studentSearchWhere(q, schoolId)),
        },
        ...groupInvoiceFilter,
        periodStart: {
          ...(lowerBound ? { gte: lowerBound } : {}),
          lte: cutoffDate,
        },
      },
      include: {
        lines: {
          include: {
            enrollment: {
              include: {
                group: {
                  include: { specialty: true, level: true },
                },
              },
            },
          },
        },
        payments: { orderBy: { paidAt: "desc" } },
        student: {
          include: {
            enrollments: {
              include: {
                group: {
                  include: { specialty: true, level: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ periodStart: "desc" }],
    });

    let totalDue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let totalLateCount = 0;

    const filtered = invoices.filter((i) => {
      const st = invoiceStatus(i);
      if (st === "PAID") return false;

      const due = effectiveDueFor(i);
      const lateDays = Math.max(0, Math.floor((cutoffDate.getTime() - due.getTime()) / DAY));
      if (onlyLate && lateDays <= 0) return false;

      return true;
    });

    const rows = filtered
      .sort((a, b) => {
        // Sort by longest overdue first, then by student name
        const delayA = Math.floor((cutoffDate.getTime() - effectiveDueFor(a).getTime()) / DAY);
        const delayB = Math.floor((cutoffDate.getTime() - effectiveDueFor(b).getTime()) / DAY);
        if (delayB !== delayA) return delayB - delayA;
        return a.student.lastName.localeCompare(b.student.lastName);
      })
      .map((i) => {
        const t = invoiceTotals(i);
        const status = invoiceStatus(i);
        const due = effectiveDueFor(i);
        const lateDays = Math.floor((cutoffDate.getTime() - due.getTime()) / DAY);
        const lastPayment = i.payments[0];

        totalDue += t.due;
        totalPaid += t.paid;
        totalRemaining += t.remaining;
        if (lateDays > 0) totalLateCount++;

        // Detailed group and subjects
        const groupLabels = Array.from(
          new Set(
            i.lines
              .map((l) => l.enrollment?.group?.name)
              .filter(Boolean)
              .concat(i.student.enrollments.map((e) => e.group.name))
          )
        ).join(", ") || i.lines.map((l) => l.label).join(", ") || "—";

        const delayLabel = lateDays > 0 ? `${lateDays} j` : "À jour (0 j)";

        return [
          `${i.student.lastName} ${i.student.firstName}`,
          i.student.parentPhone ?? "—",
          groupLabels,
          formatDate(i.periodStart),
          formatDate(i.periodEnd),
          formatDate(due),
          delayLabel,
          t.due,
          t.paid,
          t.remaining,
          statusMeta[status].label,
          lastPayment ? formatDate(lastPayment.paidAt) : "Aucun",
        ];
      });

    const windowText =
      months === "all"
        ? "Historique cumulatif inclus"
        : months === "2"
          ? `2 derniers mois (depuis le ${formatDate(minStart!)})`
          : `Mois sélectionné (depuis le ${formatDate(selectedFirst)})`;

    const subtitleParts = [
      `Arrêté au : ${formatDate(cutoffDate)}`,
      from ? `Depuis le : ${formatDate(from)}` : windowText,
      groupName ? `Groupe : ${groupName}` : undefined,
      onlyLate ? "Uniquement factures échues" : "Toutes factures non soldées",
    ].filter(Boolean);

    return {
      title: "Rapport des Élèves Non Payés (Impayés)",
      subtitle: subtitleParts.join(" · "),
      head: [
        "Élève",
        "Téléphone",
        "Groupe / Matières",
        "Début cycle",
        "Fin cycle",
        "Échéance",
        "Jours de retard",
        "Total Dû",
        "Total Payé",
        "Reste à Payer",
        "Statut",
        "Dernier paiement",
      ],
      rows,
      money: [7, 8, 9],
      slug: "eleves-non-payes",
      stats: {
        totalCount: rows.length,
        totalDue: Math.round(totalDue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        totalLateCount,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. ÉTAT DES PAIEMENTS / FACTURES (TOUT STATUT OU FILTRÉ)
  // ───────────────────────────────────────────────────────────────────────────
  if (type === "invoices") {
    const status = sp.get("status");
    const unpaidOnly = sp.get("unpaid") === "1";
    const onlyLate = sp.get("onlyLate") === "1";

    const groupInvoiceFilter = groupId
      ? {
          OR: [
            { lines: { some: { enrollment: { groupId } } } },
            { student: { enrollments: { some: { groupId } } } },
          ],
        }
      : {};

    const invoices = await db.invoice.findMany({
      where: {
        student: {
          schoolId,
          archived: false,
          ...(await studentSearchWhere(q, schoolId)),
        },
        ...groupInvoiceFilter,
        ...(range(from, to) ? { month: range(from, to) } : {}),
      },
      include: {
        lines: {
          include: {
            enrollment: {
              include: {
                group: {
                  include: { specialty: true, level: true },
                },
              },
            },
          },
        },
        payments: { orderBy: { paidAt: "desc" } },
        student: {
          include: {
            enrollments: {
              include: {
                group: {
                  include: { specialty: true, level: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ month: "desc" }],
    });

    let totalDue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let totalLateCount = 0;

    const filtered = invoices.filter((i) => {
      const st = invoiceStatus(i);
      if (status && st !== status) return false;
      if (unpaidOnly && st === "PAID") return false;

      const due = effectiveDueFor(i);
      const lateDays = Math.max(0, Math.floor((now.getTime() - due.getTime()) / DAY));
      if (onlyLate && (st === "PAID" || lateDays <= 0)) return false;

      return true;
    });

    const rows = filtered
      .sort((a, b) => b.month.getTime() - a.month.getTime() || a.student.lastName.localeCompare(b.student.lastName))
      .map((i) => {
        const t = invoiceTotals(i);
        const st = invoiceStatus(i);
        const due = effectiveDueFor(i);
        const lateDays = Math.floor((now.getTime() - due.getTime()) / DAY);

        totalDue += t.due;
        totalPaid += t.paid;
        totalRemaining += t.remaining;
        if (st !== "PAID" && lateDays > 0) totalLateCount++;

        const groupLabels = Array.from(
          new Set(
            i.lines
              .map((l) => l.enrollment?.group?.name)
              .filter(Boolean)
              .concat(i.student.enrollments.map((e) => e.group.name))
          )
        ).join(", ") || i.lines.map((l) => l.label).join(", ") || "—";

        const delayLabel = st === "PAID" ? "Soldé" : lateDays > 0 ? `${lateDays} j` : "0 j";

        return [
          `${i.student.lastName} ${i.student.firstName}`,
          i.student.parentPhone ?? "—",
          groupLabels,
          formatPeriod(i.periodStart, i.periodEnd),
          formatDate(due),
          delayLabel,
          t.due,
          t.paid,
          t.remaining,
          statusMeta[st].label,
        ];
      });

    return {
      title: unpaidOnly ? "Factures impayées" : "État des factures et paiements",
      subtitle: [
        periodLabel(sp),
        groupName ? `Groupe : ${groupName}` : undefined,
        status ? `Statut : ${statusMeta[status as keyof typeof statusMeta]?.label ?? status}` : undefined,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
      head: ["Élève", "Téléphone", "Groupe / Matières", "Période", "Échéance", "Jours de retard", "Total Dû", "Total Payé", "Reste à Payer", "Statut"],
      rows,
      money: [6, 7, 8],
      slug: unpaidOnly ? "factures-impayees" : "etat-des-factures",
      stats: {
        totalCount: rows.length,
        totalDue: Math.round(totalDue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        totalLateCount,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. REÇUS DE PAIEMENT & ENCAISSEMENTS
  // ───────────────────────────────────────────────────────────────────────────
  if (type === "receipts") {
    const groupPaymentFilter = groupId
      ? {
          OR: [
            { invoice: { lines: { some: { enrollment: { groupId } } } } },
            { invoice: { student: { enrollments: { some: { groupId } } } } },
          ],
        }
      : {};

    const payments = await db.payment.findMany({
      where: {
        invoice: {
          student: {
            schoolId,
            archived: false,
            ...(await studentSearchWhere(q, schoolId)),
          },
        },
        ...groupPaymentFilter,
        ...(range(from, to) ? { paidAt: range(from, to) } : {}),
      },
      include: {
        invoice: {
          include: {
            student: true,
            lines: { include: { enrollment: { include: { group: true } } } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    let totalPaid = 0;
    const rows = payments.map((p) => {
      const amountNum = Number(p.amount.toString());
      totalPaid += amountNum;

      const groupLabels = Array.from(
        new Set(
          p.invoice.lines
            .map((l) => l.enrollment?.group?.name)
            .filter(Boolean)
        )
      ).join(", ") || p.invoice.lines.map((l) => l.label).join(", ") || "—";

      return [
        p.receiptNo ?? `#${p.id}`,
        formatDate(p.paidAt),
        `${p.invoice.student.lastName} ${p.invoice.student.firstName}`,
        p.invoice.student.parentPhone ?? "—",
        groupLabels,
        formatPeriod(p.invoice.periodStart, p.invoice.periodEnd),
        amountNum,
        methodLabel(p.method),
      ];
    });

    return {
      title: "Journal des Reçus et Encaissements",
      subtitle: [periodLabel(sp), groupName ? `Groupe : ${groupName}` : undefined].filter(Boolean).join(" · ") || undefined,
      head: ["N° reçu", "Date", "Élève", "Téléphone", "Groupe / Matières", "Période", "Montant", "Mode"],
      rows,
      money: [6],
      slug: "recus-encaissements",
      stats: {
        totalCount: rows.length,
        totalPaid: Math.round(totalPaid * 100) / 100,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. LISTE DES INSCRIPTIONS
  // ───────────────────────────────────────────────────────────────────────────
  if (type === "enrollments") {
    const enrollStatus = sp.get("status");
    const enrollments = await db.enrollment.findMany({
      where: {
        student: {
          schoolId,
          archived: false,
          ...(await studentSearchWhere(q, schoolId)),
        },
        ...(groupId ? { groupId } : {}),
        ...(enrollStatus ? { status: enrollStatus as "ACTIVE" | "STOPPED" } : {}),
        ...(range(from, to) ? { startedAt: range(from, to) } : {}),
      },
      include: { group: { include: { specialty: true, level: true, teacher: true } }, student: true },
      orderBy: [{ status: "asc" }, { startedAt: "desc" }],
    });

    let totalMonthly = 0;
    const rows = enrollments.map((e) => {
      const fee = Number(e.monthlyFee.toString());
      totalMonthly += fee;
      return [
        `${e.student.lastName} ${e.student.firstName}`,
        e.student.parentPhone ?? "—",
        e.group.name,
        e.group.specialty.name,
        e.group.level.name,
        e.group.teacher?.name ?? "—",
        formatDate(e.startedAt),
        fee,
        e.status === "ACTIVE" ? "Active" : "Arrêtée",
      ];
    });

    return {
      title: "Liste des Inscriptions",
      subtitle: [periodLabel(sp), groupName ? `Groupe : ${groupName}` : undefined].filter(Boolean).join(" · ") || undefined,
      head: ["Élève", "Téléphone", "Groupe", "Matière", "Niveau", "Enseignant", "Date début", "Mensualité", "Statut"],
      rows,
      money: [7],
      slug: "liste-des-inscriptions",
      stats: {
        totalCount: rows.length,
        totalDue: Math.round(totalMonthly * 100) / 100,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. LISTE DES ÉLÈVES
  // ───────────────────────────────────────────────────────────────────────────
  const cols = new Set((sp.get("cols") ?? "groups,phone,status").split(","));
  const studentStatus = sp.get("status");
  const students = await db.student.findMany({
    where: {
      ...studentWhere,
      ...(studentStatus ? { status: studentStatus as "ACTIVE" | "PENDING" | "INACTIVE" } : {}),
      ...(range(from, to) ? { registeredAt: range(from, to) } : {}),
    },
    include: { enrollments: { include: { group: { include: { specialty: true, level: true } } } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const stLabel = { ACTIVE: "Actif", PENDING: "En attente", INACTIVE: "Inactif" } as const;

  const head = ["Nom complet"];
  if (cols.has("groups")) head.push("Groupes", "Matières", "Niveaux");
  if (cols.has("phone")) head.push("Parent", "Téléphone");
  head.push("Date d'inscription");
  if (cols.has("status")) head.push("Statut");

  const rows = students.map((s) => {
    const row: (string | number)[] = [`${s.lastName} ${s.firstName}`];
    if (cols.has("groups")) {
      row.push(
        s.enrollments.map((e) => e.group.name).join(", ") || "—",
        s.enrollments.map((e) => e.group.specialty.name).join(", ") || "—",
        [...new Set(s.enrollments.map((e) => e.group.level.name))].join(", ") || "—"
      );
    }
    if (cols.has("phone")) row.push(s.parentName ?? "—", s.parentPhone ?? "—");
    row.push(formatDate(s.registeredAt));
    if (cols.has("status")) row.push(stLabel[s.status] ?? s.status);
    return row;
  });

  return {
    title: "Liste des Élèves",
    subtitle: [periodLabel(sp), groupName ? `Groupe : ${groupName}` : undefined].filter(Boolean).join(" · ") || undefined,
    head,
    rows,
    money: [],
    slug: "liste-des-eleves",
    stats: {
      totalCount: rows.length,
    },
  };
}
