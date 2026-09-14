const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** Converte "2026-03-01" em Date sem sofrer com fuso horário. */
export function parseDate(value: string): Date {
  return new Date(`${value}T12:00:00Z`);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(parseDate(value));
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return "—";
  return shortDateFormatter.format(parseDate(value)).replace(".", "");
}

export function formatMonthYear(value: string) {
  const text = monthYearFormatter.format(parseDate(value));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDateRange(start: string, end: string) {
  if (start === end) return formatDate(start);
  return `${formatShortDate(start)} a ${formatDate(end)}`;
}

export function formatCurrency(value: number | null | undefined) {
  return currencyFormatter.format(value ?? 0);
}

export function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, index);
  return `${size.toFixed(index === 0 ? 0 : 1).replace(".", ",")} ${units[index]}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Dias restantes até uma data (negativo = já passou). */
export function daysUntil(value: string) {
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const target = parseDate(value);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
