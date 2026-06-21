import type { TranslationKey } from "@/i18n/translations";

/**
 * Where a buyer can collect a listing — stored on `listings.pickup_location`.
 * Values are kept in English (like category/condition) and translated for
 * display only.
 */
export const PICKUP_LOCATIONS = ["on_campus", "off_campus"] as const;

export type PickupLocation = (typeof PICKUP_LOCATIONS)[number];

/**
 * Translation key for a stored pickup_location value. Falls back to the
 * on-campus label for unknown/missing values — defensive only, since the
 * column is NOT NULL and CHECK-constrained, so real rows always have one.
 */
export const pickupLabelKey = (value: string | null | undefined): TranslationKey =>
  value === "off_campus" ? "pickupOffCampus" : "pickupOnCampus";
