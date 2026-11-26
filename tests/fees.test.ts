import { describe, expect, it } from "vitest";
import { invoiceStatus, invoiceTotals, isOverdue, registrationState } from "@/lib/fees";

const utc = (year: number, month: number, day = 1) => new Date(Date.UTC(year, month - 1, day));
const invoice = (payments: number[] = []) => ({
  lines: [{ amount: "500" }, { amount: 250 }],
  payments: payments.map((amount) => ({ amount })),
  month: utc(2026, 11, 1),
  periodStart: utc(2026, 10, 15),
});

describe("invoice totals and status", () => {
  it("sums lines and payments as decimals", () => {
    expect(invoiceTotals(invoice([100, 200])).due).toBe(750);
    expect(invoiceTotals(invoice([100, 200])).paid).toBe(300);
    expect(invoiceTotals(invoice([100, 200])).remaining).toBe(450);
  });

  it("never reports a negative remaining amount", () => {
    expect(invoiceTotals(invoice([800])).remaining).toBe(0);
    expect(invoiceStatus(invoice([800]))).toBe("PAID");
  });

  it("classifies unpaid and partial invoices", () => {
    expect(invoiceStatus(invoice())).toBe("UNPAID");
    expect(invoiceStatus(invoice([100]))).toBe("PARTIAL");
  });

  it("uses the monthly rule for overdue, and ignores paid invoices", () => {
    expect(isOverdue(invoice(), utc(2026, 11, 16))).toBe(true);
    expect(isOverdue(invoice(), utc(2026, 11, 15))).toBe(false);
    expect(isOverdue(invoice([750]), utc(2026, 11, 20))).toBe(false);
  });
});

describe("registration periods", () => {
  const period = { startDate: utc(2026, 11, 1), endDate: utc(2026, 11, 30), closedAt: null };
  it("computes the open state from dates only", () => {
    expect(registrationState(period, utc(2026, 10, 31))).toBe("UPCOMING");
    expect(registrationState(period, utc(2026, 11, 15))).toBe("OPEN");
    expect(registrationState(period, utc(2026, 12, 1))).toBe("CLOSED");
    expect(registrationState({ ...period, closedAt: utc(2026, 11, 10) }, utc(2026, 11, 15))).toBe("CLOSED");
    expect(registrationState(null)).toBe("NONE");
  });
});
