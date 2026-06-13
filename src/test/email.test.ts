import { describe, it, expect } from "vitest";
import { normalizeEmail, isAllowedReichmanEmail } from "@/lib/email";

describe("normalizeEmail", () => {
  it("trims surrounding whitespace and lowercases", () => {
    expect(normalizeEmail("  Student@Post.Runi.AC.il  ")).toBe("student@post.runi.ac.il");
  });
});

describe("isAllowedReichmanEmail", () => {
  it("accepts a student address regardless of case or whitespace", () => {
    expect(isAllowedReichmanEmail("jane.doe@post.runi.ac.il")).toBe(true);
    expect(isAllowedReichmanEmail("  JANE@POST.RUNI.AC.IL ")).toBe(true);
  });

  it("rejects non-student domains", () => {
    expect(isAllowedReichmanEmail("jane@gmail.com")).toBe(false);
    // staff/other Reichman subdomain without the required @post prefix
    expect(isAllowedReichmanEmail("jane@runi.ac.il")).toBe(false);
  });

  it("rejects look-alike domains that merely end with the suffix", () => {
    expect(isAllowedReichmanEmail("jane@evilpost.runi.ac.il")).toBe(false);
    expect(isAllowedReichmanEmail("jane@post.runi.ac.il.attacker.com")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isAllowedReichmanEmail("")).toBe(false);
  });
});
