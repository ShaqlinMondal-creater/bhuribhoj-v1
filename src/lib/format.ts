export const KOLKATA_TIME_ZONE = "Asia/Kolkata";

export function kolkataDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: KOLKATA_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function inr(value?: number | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function longKolkataDate(value: string) {
  const date = kolkataInstant(value);
  if (!date) return value;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KOLKATA_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const day = Number(read("day"));
  if (!day) return value;
  return `${ordinal(day)} ${read("month")}, ${read("year")} - ${read("weekday")}`;
}

function kolkataInstant(value: string) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (match) return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 6, 0, 0));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ordinal(day: number) {
  const mod = day % 100;
  if (mod >= 11 && mod <= 13) return `${day}th`;
  if (day % 10 === 1) return `${day}st`;
  if (day % 10 === 2) return `${day}nd`;
  if (day % 10 === 3) return `${day}rd`;
  return `${day}th`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
