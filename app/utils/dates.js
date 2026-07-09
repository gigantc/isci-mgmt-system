/**
 * Date utilities for calendar-date (date-only) values like `airDate`.
 *
 * `airDate` is stored as a plain string ("YYYY-MM-DD" or a full ISO). It's a
 * calendar date, not a moment in time — do NOT route it through `new Date()`
 * for display, because JS parses date-only strings as UTC midnight and then
 * getDate/getMonth in a west-of-UTC timezone rolls the day back by one.
 *
 * These helpers extract Y/M/D from the string directly and format them.
 */

const extractYMD = (value) => {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { year: match[1], month: match[2], day: match[3] };
};

/**
 * Format an air-date string as MM.DD.YYYY (Detail page style).
 * Returns "N/A" if the value is missing/unparseable, "TBD" passthrough.
 */
export const formatAirDateDot = (value) => {
  if (!value) return "N/A";
  if (value === "TBD") return "TBD";
  const ymd = extractYMD(value);
  if (!ymd) return "N/A";
  return `${ymd.month}.${ymd.day}.${ymd.year}`;
};

/**
 * Format an air-date string as M/D/YYYY (list-view style).
 */
export const formatAirDateSlash = (value) => {
  if (!value) return "N/A";
  if (value === "TBD") return "TBD";
  const ymd = extractYMD(value);
  if (!ymd) return "N/A";
  return `${Number(ymd.month)}/${Number(ymd.day)}/${ymd.year}`;
};

/**
 * Format an air-date string as MM-DD-YY (Slate style).
 */
export const formatAirDateSlateShort = (value) => {
  if (!value || value === "TBD") return "TBD";
  const ymd = extractYMD(value);
  if (!ymd) return "TBD";
  return `${ymd.month}-${ymd.day}-${ymd.year.slice(-2)}`;
};
