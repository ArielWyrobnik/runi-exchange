import { describe, it, expect } from "vitest";
import { privacyPolicy, PRIVACY_CONTACT_EMAIL, type PolicyContent } from "@/i18n/privacyPolicy";

const languages = ["en", "he"] as const;

describe("privacy policy", () => {
  it("has the same section structure in both languages", () => {
    const { en, he } = privacyPolicy;
    expect(he.sections.length).toBe(en.sections.length);
    en.sections.forEach((section, i) => {
      const counterpart = he.sections[i];
      expect(counterpart.body.length, `body length differs in section ${i}`).toBe(
        section.body.length,
      );
      expect(
        counterpart.bullets?.length ?? 0,
        `bullet count differs in section ${i}`,
      ).toBe(section.bullets?.length ?? 0);
    });
  });

  it("has matching intro length and update date", () => {
    expect(privacyPolicy.he.intro.length).toBe(privacyPolicy.en.intro.length);
    // Both languages must state the same revision, otherwise one reads as stale.
    expect(privacyPolicy.he.lastUpdated).not.toBe("");
    expect(privacyPolicy.en.lastUpdated).not.toBe("");
  });

  it("has no empty text anywhere", () => {
    const strings = (policy: PolicyContent) => [
      policy.title,
      policy.lastUpdated,
      ...policy.intro,
      ...policy.sections.flatMap((s) => [s.heading, ...s.body, ...(s.bullets ?? [])]),
    ];
    for (const lang of languages) {
      for (const value of strings(privacyPolicy[lang])) {
        expect(value.trim(), `empty policy string in ${lang}`).not.toBe("");
      }
    }
  });

  it("names the contact address in both languages", () => {
    for (const lang of languages) {
      const policy = privacyPolicy[lang];
      const all = policy.sections
        .flatMap((s) => [...s.body, ...(s.bullets ?? [])])
        .join(" ");
      expect(all, `contact email missing in ${lang}`).toContain(PRIVACY_CONTACT_EMAIL);
    }
  });
});
