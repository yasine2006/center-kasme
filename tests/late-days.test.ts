import { describe, expect, it } from "vitest";
import {
  effectiveDueDate,
  effectiveLateDays,
  enrollmentAnchor,
  isDueAsOf,
  lateDaysForMonth,
  monthlyDueDate,
} from "@/lib/late-days";

const utc = (year: number, month: number, day = 1) => new Date(Date.UTC(year, month - 1, day));

describe("monthly anniversary rule", () => {
  it("keeps the enrollment day in a normal month", () => {
    expect(monthlyDueDate(utc(2026, 10, 15), utc(2026, 11, 1))).toEqual(utc(2026, 11, 15));
  });

  it("clamps to the last day of short months and restores the day afterwards", () => {
    expect(monthlyDueDate(utc(2026, 1, 31), utc(2026, 2, 1))).toEqual(utc(2026, 2, 28));
    expect(monthlyDueDate(utc(2026, 1, 31), utc(2026, 3, 1))).toEqual(utc(2026, 3, 31));
    expect(monthlyDueDate(utc(2024, 1, 31), utc(2024, 2, 1))).toEqual(utc(2024, 2, 29));
  });

  it("only counts days after the due date, resetting each month", () => {
    const start = utc(2026, 10, 15);
    expect(lateDaysForMonth(start, utc(2026, 11, 1), utc(2026, 11, 14))).toBe(0);
    expect(lateDaysForMonth(start, utc(2026, 11, 1), utc(2026, 11, 15))).toBe(0);
    expect(lateDaysForMonth(start, utc(2026, 11, 1), utc(2026, 11, 16))).toBe(1);
    expect(lateDaysForMonth(start, utc(2026, 12, 1), utc(2026, 12, 1))).toBe(0);
  });

  it("treats the due day itself as due", () => {
    const start = utc(2026, 10, 15);
    expect(isDueAsOf(start, utc(2026, 11, 1), utc(2026, 11, 14))).toBe(false);
    expect(isDueAsOf(start, utc(2026, 11, 1), utc(2026, 11, 15))).toBe(true);
  });

  it("uses the invoice periodStart + month rather than the stale stored dueDate", () => {
    const invoice = { periodStart: utc(2026, 10, 15), month: utc(2026, 11, 1) };
    expect(effectiveDueDate(invoice)).toEqual(utc(2026, 11, 15));
    expect(effectiveLateDays(invoice, utc(2026, 11, 18))).toBe(3);
  });

  it("picks the oldest active enrollment as anchor", () => {
    expect(enrollmentAnchor([{ startedAt: utc(2026, 3, 10) }, { startedAt: utc(2025, 8, 2) }])).toEqual(
      utc(2025, 8, 2),
    );
    expect(enrollmentAnchor([])).toBeNull();
  });
});
