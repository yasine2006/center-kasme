import { describe, expect, it } from "vitest";
import { addMonthsClamped, billingAnchor, cycleAt, cycleIndexForDate, monthStart } from "@/lib/invoicing";

const utc = (year: number, month: number, day = 1, hour = 0) =>
  new Date(Date.UTC(year, month - 1, day, hour));

describe("billing cycles", () => {
  it("adds months while clamping to the target month length", () => {
    expect(addMonthsClamped(utc(2026, 1, 31), 1)).toEqual(utc(2026, 2, 28));
    expect(addMonthsClamped(utc(2026, 1, 31), 2)).toEqual(utc(2026, 3, 31));
  });

  it("builds a cycle whose due date is the anniversary inside that cycle's month", () => {
    const anchor = utc(2025, 10, 15);
    const cycle = cycleAt(anchor, 1);
    expect(cycle.month).toEqual(utc(2025, 11, 1));
    expect(cycle.start).toEqual(utc(2025, 11, 15));
    expect(cycle.end).toEqual(utc(2025, 12, 15));
    expect(cycle.dueDate).toEqual(utc(2025, 11, 15));
  });

  it("uses midnight UTC of the oldest enrollment as anchor", () => {
    expect(billingAnchor([{ startedAt: utc(2026, 5, 12, 23) }, { startedAt: utc(2025, 9, 3, 8) }])).toEqual(
      utc(2025, 9, 3),
    );
  });

  it("finds the cycle containing a date", () => {
    const anchor = utc(2025, 10, 15);
    expect(cycleIndexForDate(anchor, utc(2025, 10, 14))).toBe(-1);
    expect(cycleIndexForDate(anchor, utc(2025, 10, 15))).toBe(0);
    expect(cycleIndexForDate(anchor, utc(2025, 11, 20))).toBe(1);
  });

  it("normalizes a date to the first of its UTC month", () => {
    expect(monthStart(utc(2026, 7, 19))).toEqual(utc(2026, 7, 1));
  });
});
