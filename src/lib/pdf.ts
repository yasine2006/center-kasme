import "server-only";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatDH, formatPeriod } from "@/lib/format";

type School = { name: string; logo: string | null; address: string | null; phone: string | null; email: string | null };

const NAVY: [number, number, number] = [20, 30, 60];
const DARK: [number, number, number] = [30, 40, 60];
const GREY: [number, number, number] = [90, 100, 120];
const LIGHT: [number, number, number] = [245, 247, 250];
const LINE: [number, number, number] = [210, 215, 225];

function header(doc: jsPDF, school: School, title: string) {
  const w = doc.internal.pageSize.getWidth();
  let x = 14;
  if (school.logo?.startsWith("data:image/")) {
    try {
      const fmt = school.logo.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(school.logo, fmt, 14, 10, 16, 16);
      x = 34;
    } catch {
      /* unreadable logo: skip it */
    }
  }
  // Center name — elegant, medium weight
  doc.setTextColor(...NAVY).setFont("helvetica", "bold").setFontSize(15).text(school.name, x, 17);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
  const line = [school.address, school.phone, school.email].filter(Boolean).join("  ·  ");
  if (line) doc.text(line, x, 23);
  // Thin separator
  doc.setDrawColor(...LINE).setLineWidth(0.3).line(14, 30, w - 14, 30);

  // Title — simple, centered, neutral
  doc.setTextColor(...DARK).setFont("helvetica", "bold").setFontSize(14).text(title, 14, 40);
  doc.setDrawColor(...NAVY).setLineWidth(0.6).line(14, 42, 14 + doc.getTextWidth(title), 42);
}

function footer(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...GREY);
  doc.text("Document généré automatiquement", 14, h - 8);
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
  const metaY = 50;
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
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
  for (const [k, v] of leftCol) {
    doc.text(k, 14, y);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...DARK).text(String(v), 14, y + 5);
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
    y += 12;
  }
  y = metaY;
  for (const [k, v] of rightCol) {
    doc.text(k, w / 2 + 4, y);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...DARK).text(String(v), w / 2 + 4, y + 5);
    doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
    y += 12;
  }

  // Lines table
  autoTable(doc, {
    startY: 100,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2.4, textColor: DARK, font: "helvetica" },
    headStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold", fontSize: 10 },
    columnStyles: { 1: { halign: "right", cellWidth: 40 } },
    head: [["Matière / Groupe", "Montant (DH)"]],
    body: d.lines.map((l) => [l.label, formatDH(l.amount)]),
    foot: [["Total dû", formatDH(d.due)]],
    footStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [252, 252, 253] },
    tableLineWidth: 0.2,
    tableLineColor: LINE,
  });

  const y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Totals box
  const boxX = w - 74;
  doc.setFillColor(...LIGHT).roundedRect(boxX, y2, 60, 34, 2, 2, "F");
  doc.setDrawColor(...LINE).roundedRect(boxX, y2, 60, 34, 2, 2, "S");
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...GREY);
  doc.text("Total dû", boxX + 4, y2 + 7);
  doc.text("Payé", boxX + 4, y2 + 14);
  doc.text("Reste à payer", boxX + 4, y2 + 21);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...DARK);
  doc.text(formatDH(d.due), boxX + 56, y2 + 7, { align: "right" });
  doc.text(formatDH(d.paid), boxX + 56, y2 + 14, { align: "right" });
  doc.setFont("helvetica", "bold").setTextColor(d.remaining > 0 ? 180 : 60, d.remaining > 0 ? 40 : 120, d.remaining > 0 ? 40 : 80);
  doc.text(formatDH(d.remaining), boxX + 56, y2 + 21, { align: "right" });

  // Status (simple text, no pill)
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...DARK);
  doc.text(`Statut : ${d.status}`, 14, y2 + 7);

  // Payments history
  if (d.payments && d.payments.length) {
    const py = y2 + 42;
    doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...NAVY).text("Historique des versements", 14, py);
    autoTable(doc, {
      startY: py + 4,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 1.6, textColor: DARK },
      headStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 }, 3: { halign: "right", cellWidth: 30 } },
      head: [["Date", "Mode", "Référence", "Montant"]],
      body: d.payments.map((p) => [formatDate(p.date), p.method, p.reference ?? "—", formatDH(p.amount)]),
      tableLineWidth: 0.2,
      tableLineColor: LINE,
    });
  }

  // Footer note
  const fy = doc.internal.pageSize.getHeight() - 22;
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
  doc.text("Les montants sont exprimés en dirhams (DH). Échéance : 5 jours après la fin de la période.", 14, fy);
  doc.text("Merci de régulariser avant l'échéance.", 14, fy + 4);

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

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...DARK).text(d.receiptNo, w - 14, 50, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY).text(`Date : ${formatDate(d.paidAt)}`, w - 14, 55, { align: "right" });

  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...DARK).text("Élève", 14, 50);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...DARK).text(d.student, 14, 55);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY).text(`Période : ${formatPeriod(d.periodStart, d.periodEnd)}`, 14, 60);

  autoTable(doc, {
    startY: 68,
    theme: "plain",
    styles: { fontSize: 9.5, cellPadding: 1.8, textColor: DARK },
    headStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold" },
    columnStyles: { 1: { halign: "right", cellWidth: 34 } },
    head: [["Matière", "Montant"]],
    body: [
      ...d.lines.map((l) => [l.label, formatDH(l.amount)]),
      ...(d.lines.length > 1 ? [["Total de la période", formatDH(d.due)]] : []),
    ],
    foot: [["Total payé à ce jour", formatDH(d.paidTotal)]],
    footStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold" },
    tableLineWidth: 0.2,
    tableLineColor: LINE,
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setFillColor(...LIGHT).roundedRect(14, y, 88, 16, 2, 2, "F");
  doc.setDrawColor(...LINE).roundedRect(14, y, 88, 16, 2, 2, "S");
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...DARK).text(`Montant reçu : ${formatDH(d.amount)}`, 18, y + 7);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY).text(`Mode : ${d.method}`, 18, y + 13);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY).text(`Reste à payer : ${formatDH(Math.max(d.due - d.paidTotal, 0))}`, 110, y + 7);
  doc.text("Cachet et signature", w - 14, y + 13, { align: "right" });

  footer(doc);
  return out(doc);
}

export function tablePdf(d: { school: School; title: string; subtitle?: string; head: string[]; body: string[][] }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  header(doc, d.school, d.title);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...GREY);
  doc.text([d.subtitle, `Généré le ${formatDate(new Date())}`].filter(Boolean).join("  ·  "), 14, 48);

  autoTable(doc, {
    startY: 54,
    head: [d.head],
    body: d.body,
    styles: { fontSize: 8.5, cellPadding: 2.2, textColor: DARK },
    headStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [252, 252, 253] },
    tableLineWidth: 0.2,
    tableLineColor: LINE,
  });
  footer(doc);
  return out(doc);
}
