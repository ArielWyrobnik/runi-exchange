/**
 * Pure helpers for the event import review form.
 *
 * go-out.co does not always expose an explicit end time, but RUNI Tickets
 * needs one to auto-delete the event after it is over. `suggestEndsAt`
 * produces a sensible default the admin can adjust before publishing.
 */

const HOUR_MS = 60 * 60 * 1000;

/**
 * Suggest an end time from a start time:
 * - Evening start (18:00 or later): ends the next calendar day at 04:00
 *   (typical campus party that runs past midnight).
 * - After-midnight start (before 05:00): ends the same day at 04:00.
 * - Daytime start: ends four hours later.
 * Always returns a time strictly after the start.
 */
export const suggestEndsAt = (startsAt: string): string => {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return startsAt;

  const end = new Date(start);
  const hour = start.getHours();

  if (hour >= 18) {
    end.setDate(end.getDate() + 1);
    end.setHours(4, 0, 0, 0);
  } else if (hour < 5) {
    end.setHours(4, 0, 0, 0);
  } else {
    end.setHours(end.getHours() + 4);
  }

  if (end.getTime() <= start.getTime()) {
    end.setTime(start.getTime() + 4 * HOUR_MS);
  }
  return end.toISOString();
};

/** ISO timestamp → value for an <input type="datetime-local"> (local time). */
export const toDatetimeLocal = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

/** <input type="datetime-local"> value (local time) → ISO timestamp. */
export const fromDatetimeLocal = (local: string): string => {
  if (!local) return "";
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
};
