import { describe, it, expect } from "vitest";
import { suggestEndsAt, toDatetimeLocal, fromDatetimeLocal } from "@/lib/eventTime";

const HOUR = 60 * 60 * 1000;

describe("suggestEndsAt", () => {
  it("ends an evening party the next day at 04:00", () => {
    // Fri 22:00 local → Sat 04:00 local = 6 hours later.
    const start = new Date(2026, 5, 19, 22, 0, 0);
    const end = new Date(suggestEndsAt(start.toISOString()));
    expect(end.getHours()).toBe(4);
    expect(end.getTime() - start.getTime()).toBe(6 * HOUR);
  });

  it("ends an after-midnight start the same day at 04:00", () => {
    // 01:00 local → 04:00 local = 3 hours later.
    const start = new Date(2026, 5, 20, 1, 0, 0);
    const end = new Date(suggestEndsAt(start.toISOString()));
    expect(end.getHours()).toBe(4);
    expect(end.getDate()).toBe(20);
    expect(end.getTime() - start.getTime()).toBe(3 * HOUR);
  });

  it("ends a daytime event four hours after it starts", () => {
    const start = new Date(2026, 5, 20, 14, 0, 0);
    const end = new Date(suggestEndsAt(start.toISOString()));
    expect(end.getTime() - start.getTime()).toBe(4 * HOUR);
  });

  it("never returns a time at or before the start", () => {
    // 04:30 falls in the after-midnight branch but 04:00 would be earlier.
    const start = new Date(2026, 5, 20, 4, 30, 0);
    const end = new Date(suggestEndsAt(start.toISOString()));
    expect(end.getTime()).toBeGreaterThan(start.getTime());
  });

  it("returns the input unchanged when it is not a valid date", () => {
    expect(suggestEndsAt("not-a-date")).toBe("not-a-date");
  });
});

describe("datetime-local round-trip", () => {
  it("converts ISO to a local datetime-local value and back", () => {
    const start = new Date(2026, 5, 19, 22, 0, 0);
    const local = toDatetimeLocal(start.toISOString());
    expect(local).toBe("2026-06-19T22:00");
    expect(fromDatetimeLocal(local)).toBe(start.toISOString());
  });

  it("returns empty strings for invalid input", () => {
    expect(toDatetimeLocal("nope")).toBe("");
    expect(fromDatetimeLocal("")).toBe("");
  });
});
