import "server-only";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatDH, formatPeriod } from "@/lib/format";

type School = { name: string; logo: string | null; address: string | null; phone: string | null; email: string | null };

const NAVY: [number, number, number] = [11, 27, 59];
const BLUE: [number, number, number] = [31, 90, 240];
const GREY: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [239, 245, 255];

function header(doc: jsPDF, school: School, title: string) {
  const w = doc.internal.pageSize.getWidth();
  let x = 14;
  if (school.logo?.startsWith("data:image/")) {
    try {
      const fmt = school.logo.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(school.logo, fmt, 14, 10, 20, 20);
      x = 38;
    } catch {
      /* unreadable logo: skip it */
    }
  }
  doc.setTextColor(...NAVY).setFont("helvetica", "bold").setFontSize(17).text(school.name, x, 18);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY);
  const line = [school.address, school.phone, school.email].filter(Boolean).join("  ·  ");
  if (line) doc.text(line, x, 24);
  doc.setDrawColor(220, 228, 240).setLineWidth(0.4).line(14, 34, w - 14, 34);

  // Title band
  doc.setFillColor(...NAVY).rect(14, 38, w - 28, 11, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(13).text(title, 18, 45.5);
}

function footer(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GREY);
  doc.text("Document généré automatiquement — Gestion scolaire", 14, h - 8);
  doc.text(`Page ${doc.getNumberOfPages()}`, w - 14, h - 8, { align: "right" });
}

const out = (doc: jsPDF) => Buffer.from(doc.output("arraybuffer"));

export function invoicePdf(d: {
  school: School;
  invoiceNo: string;
  issuedAt: Date;
  student: string;
  studentCode?: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  lines: { label: string; amount: number }[];
  due: number;
  paid: number;
  remaining: number;
  status: string;
  payments?: { date: Date; amount: number; method: string; reference?: string | null }[];
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  header(doc, d.school, "FACTURE");

  // Meta block
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(15, 27, 51);
  const metaY = 54;
  const leftCol = [
    ["N° facture", d.invoiceNo],
    ["Date d'émission", formatDate(d.issuedAt)],
    ["Période", formatPeriod(d.periodStart, d.periodEnd)],
    ["Échéance", formatDate(d.dueDate)],
  ];
  const rightCol = [
    ["Élève", d.student],
    ...(d.studentCode ? [["Code élève", d.studentCode]] : []),
    ["Statut", d.status],
  ];

  let y = metaY;
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...GREY);
  for (const [k, v] of leftCol) {
    doc.text(k.toUpperCase(), 14, y);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(15, 27, 51).text(String(v), 14, y + 5);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...GREY);
    y += 12;
  }
  y = metaY;
  for (const [k, v] of rightCol) {
    doc.text(k.toUpperCase(), w / 2 + 4, y);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(15, 27, 51).text(String(v), w / 2 + 4, y + 5);
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...GREY);
    y += 12;
  }

  // Lines table
  autoTable(doc, {
    startY: 104,
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 2.6, textColor: [15, 27, 51] },
    headStyles: { fillColor: BLUE, textColor: 255, fontStyle: "bold", fontSize: 10 },
    columnStyles: { 1: { halign: "right", cellWidth: 40 } },
    head: [["Matière / Groupe", "Montant (DH)"]],
    body: d.lines.map((l) => [l.label, formatDH(l.amount)]),
    foot: [["Total dû", formatDH(d.due)]],
    footStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold", halign: "right" },
    alternateRowStyles: { fillColor: [247, 249, 252] },
  });

  const y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Totals box
  const boxX = w - 74;
  doc.setFillColor(...LIGHT).roundedRect(boxX, y2, 60, 34, 2, 2, "F");
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(60, 72, 95);
  doc.text("Total dû", boxX + 4, y2 + 7);
  doc.text("Payé", boxX + 4, y2 + 14);
  doc.text("Reste à payer", boxX + 4, y2 + 21);
  doc.setFont("helvetica", "bold").setTextColor(...NAVY);
  doc.text(formatDH(d.due), boxX + 56, y2 + 7, { align: "right" });
  doc.text(formatDH(d.paid), boxX + 56, y2 + 14, { align: "right" });
  doc.setTextColor(d.remaining > 0 ? 220 : 22, d.remaining > 0 ? 38 : 163, d.remaining > 0 ? 38 : 74);
  doc.text(formatDH(d.remaining), boxX + 56, y2 + 21, { align: "right" });

  // Status pill
  const statusColor: Record<string, [number, number, number]> = {
    PAID: [22, 163, 74],
    PARTIAL: [217, 119, 6],
    UNPAID: [220, 38, 38],
  };
  const sc = statusColor[d.status] ?? GREY;
  doc.setFillColor(...sc).roundedRect(14, y2, 46, 9, 2, 2, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(9).text(d.status, 37, y2 + 6, { align: "center" });

  // Payments history
  if (d.payments && d.payments.length) {
    const py = y2 + 42;
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...NAVY).text("Historique des versements", 14, py);
    autoTable(doc, {
      startY: py + 4,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.6, textColor: [15, 27, 51] },
      headStyles: { fillColor: [247, 249, 252], textColor: NAVY, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 }, 3: { halign: "right", cellWidth: 30 } },
      head: [["Date", "Mode", "Référence", "Montant"]],
      body: d.payments.map((p) => [formatDate(p.date), p.method, p.reference ?? "—", formatDH(p.amount)]),
    });
  }

  // Footer note
  const fy = doc.internal.pageSize.getHeight() - 26;
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
  doc.text("Les montants sont exprimés en dirhams (DH). Échéance : 5 jours après la fin de la période.", 14, fy);
  doc.text("Merci de régulariser avant l'échéance pour éviter les rappels.", 14, fy + 4);

  footer(doc);
  return out(doc);
}

export function receiptPdf(d: {
  school: School;
  receiptNo: string;
  paidAt: Date;
  student: string;
  periodStart: Date;
  periodEnd: Date;
  lines: { label: string; amount: number }[];
  amount: number;
  method: string;
  due: number;
  paidTotal: number;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a5", orientation: "landscape" });
  const w = doc.internal.pageSize.getWidth();
  header(doc, d.school, "REÇU DE PAIEMENT");

  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...BLUE).text(d.receiptNo, w - 14, 52, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY).text(`Date : ${formatDate(d.paidAt)}`, w - 14, 58, { align: "right" });

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...NAVY).text("Élève", 14, 52);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(15, 27, 51).text(d.student, 14, 58);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY).text(`Période : ${formatPeriod(d.periodStart, d.periodEnd)}`, 14, 63);

  autoTable(doc, {
    startY: 70,
    theme: "striped",
    styles: { fontSize: 9.5, cellPadding: 1.8, textColor: [15, 27, 51] },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right", cellWidth: 34 } },
    head: [["Matière", "Montant"]],
    body: [
      ...d.lines.map((l) => [l.label, formatDH(l.amount)]),
      ...(d.lines.length > 1 ? [["Total de la période", formatDH(d.due)]] : []),
    ],
    foot: [["Total payé à ce jour", formatDH(d.paidTotal)]],
    footStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold" },
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setFillColor(...LIGHT).roundedRect(14, y, 88, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...NAVY).text(`Montant reçu : ${formatDH(d.amount)}`, 18, y + 7);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY).text(`Mode : ${d.method}`, 18, y + 13);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY).text(`Reste à payer : ${formatDH(Math.max(d.due - d.paidTotal, 0))}`, 110, y + 7);
  doc.text("Cachet et signature", w - 14, y + 13, { align: "right" });

  footer(doc);
  return out(doc);
}

export function tablePdf(d: { school: School; title: string; subtitle?: string; head: string[]; body: string[][] }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, d.school, d.title);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...GREY);
  doc.text([d.subtitle, `Généré le ${formatDate(new Date())}`].filter(Boolean).join("  ·  "), 14, 52);

  autoTable(doc, {
    startY: 58,
    head: [d.head],
    body: d.body,
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: [15, 27, 51] },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    didDrawPage: () => {
      const pages = doc.getNumberOfPages();
      doc.setFontSize(8).setTextColor(150).text(`Page ${pages}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
    },
  });
  footer(doc);
  return out(doc);
}
