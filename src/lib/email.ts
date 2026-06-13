/** Email helpers for the Reichman-student signup restriction. Kept as
 *  pure functions so the domain rule can be unit-tested independently of
 *  the auth flow (it is also enforced server-side by a DB trigger). */

import { ALLOWED_EMAIL_DOMAIN } from "./constants";

/** Lowercase + trim — how addresses are normalized before signup. */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** True if the address belongs to the Reichman student domain. */
export const isAllowedReichmanEmail = (email: string): boolean =>
  normalizeEmail(email).endsWith(ALLOWED_EMAIL_DOMAIN);
