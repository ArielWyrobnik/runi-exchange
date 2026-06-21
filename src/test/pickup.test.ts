import { describe, it, expect } from "vitest";
import { PICKUP_LOCATIONS, pickupLabelKey } from "@/lib/pickup";
import { en, he } from "@/i18n/translations";

describe("pickup location", () => {
  it("maps every stored value to a label present in both dictionaries", () => {
    for (const value of PICKUP_LOCATIONS) {
      const key = pickupLabelKey(value);
      expect(en[key], `missing en label for ${value}`).toBeTruthy();
      expect(he[key], `missing he label for ${value}`).toBeTruthy();
    }
  });

  it("maps the two known values to distinct labels", () => {
    expect(pickupLabelKey("on_campus")).toBe("pickupOnCampus");
    expect(pickupLabelKey("off_campus")).toBe("pickupOffCampus");
  });

  it("falls back to the on-campus label for missing/unknown values", () => {
    expect(pickupLabelKey(undefined)).toBe("pickupOnCampus");
    expect(pickupLabelKey(null)).toBe("pickupOnCampus");
    expect(pickupLabelKey("")).toBe("pickupOnCampus");
    expect(pickupLabelKey("something_else")).toBe("pickupOnCampus");
  });
});
