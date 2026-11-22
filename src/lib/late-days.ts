/**
 * Règle métier partagée : échéance = ANNIVERSAIRE MENSUEL de l'inscription.
 *
 * - On prend le jour du mois de la date d'inscription active la plus ancienne.
 * - Dans un mois plus court, l'échéance est ramenée au dernier jour du mois
 *   (31/01 → 28/02, ou 29/02 les années bissextiles), puis revient au 31 en mars.
 * - Aucun délai de grâce : le retard est de 1 j dès le lendemain de l'échéance
 *   et il repart de 0 au début de chaque mois de facturation.
 *
 * Exemple (inscription le 15/10) :
 *   16/10 = 1 j · 16/11 = 1 j · 16/12 = 1 j.
 *
 * Toutes les dates sont en UTC ; un « month » est toujours le 1er jour du mois UTC.
 */
const DAY = 86_400_000;

const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const monthOf = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));

/** Ancre de facturation = date d'inscription active la plus ancienne. */
export function enrollmentAnchor(enrollments: { startedAt: Date }[]): Date | null {
  return enrollments.reduce<Date | null>((min, e) => (!min || e.startedAt.getTime() < min.getTime() ? e.startedAt : min), null);
}

/** Nombre de jours du mois UTC contenant `month`. */
export const daysInMonth = (month: Date) =>
  new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();

/**
 * Échéance mensuelle : même jour du mois que l'inscription, plafonné au
 * dernier jour du mois demandé. `month` est le 1er jour du mois UTC voulu.
 */
export function monthlyDueDate(start: Date, month: Date): Date {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const dueDay = Math.min(start.getUTCDate(), daysInMonth(month));
  return new Date(Date.UTC(year, monthIndex, dueDay));
}

/** L'échéance du mois est-elle atteinte à `asOf` (comparaison en début de jour UTC) ? */
export function isDueAsOf(start: Date, month: Date, asOf: Date = new Date()): boolean {
  return startOfDay(asOf) >= startOfDay(monthlyDueDate(start, month));
}

/** Retard du mois, borné à 0 et remis à zéro à chaque nouveau mois. */
export function lateDaysForMonth(start: Date, month: Date, asOf: Date = new Date()): number {
  const due = startOfDay(monthlyDueDate(start, month)).getTime();
  return Math.max(0, Math.floor((startOfDay(asOf).getTime() - due) / DAY));
}

type InvoiceMonth = { periodStart: Date; month: Date };

/**
 * Source de vérité pour une facture lue en base : on recalcule l'échéance à la
 * lecture plutôt que de faire confiance à `Invoice.dueDate` (qui peut être
 * périmé pour les anciennes factures).
 */
export const effectiveDueDate = (invoice: InvoiceMonth) => monthlyDueDate(invoice.periodStart, invoice.month);

/** Retard effectif de la facture, avec la même règle mensuelle. */
export const effectiveLateDays = (invoice: InvoiceMonth, asOf: Date = new Date()) =>
  lateDaysForMonth(invoice.periodStart, invoice.month, asOf);

/**
 * FALLBACK UNIQUEMENT : ancienne API conservée pour les appelés qui n'ont pas
 * de mois explicite. Elle délègue désormais à la règle de l'anniversaire
 * mensuel (mois de l'inscription / mois courant). À ne pas utiliser dans un
 * nouveau calcul : préférer monthlyDueDate / lateDaysForMonth.
 */
export function dueDateFromEnrollment(start: Date): Date {
  return monthlyDueDate(start, monthOf(start));
}

/** FALLBACK UNIQUEMENT : voir dueDateFromEnrollment. */
export function lateDaysFromEnrollment(start: Date, asOf: Date = new Date()): number {
  return lateDaysForMonth(start, monthOf(asOf), asOf);
}
