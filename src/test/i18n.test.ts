import { describe, it, expect } from "vitest";
import { en, he, conditionNames } from "@/i18n/translations";
import { categoryNames } from "@/i18n/categoryNames";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";

describe("translations", () => {
  it("hebrew covers every english key", () => {
    const enKeys = Object.keys(en).sort();
    const heKeys = Object.keys(he).sort();
    expect(heKeys).toEqual(enKeys);
  });

  it("no empty translation values", () => {
    for (const dict of [en, he]) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `empty translation for ${key}`).not.toBe("");
      }
    }
  });

  it("hebrew names exist for every category and condition", () => {
    for (const category of CATEGORIES) {
      expect(categoryNames.he[category], `missing he category: ${category}`).toBeTruthy();
    }
    for (const condition of CONDITIONS) {
      expect(conditionNames.he[condition], `missing he condition: ${condition}`).toBeTruthy();
    }
  });
});
