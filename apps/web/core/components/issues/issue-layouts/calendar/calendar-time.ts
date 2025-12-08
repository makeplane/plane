export const isoToLocalDate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

export const isoToLocalHour = (iso?: string | null): number | null => {
  const d = isoToLocalDate(iso);
  return d ? d.getHours() : null;
};

export const isoToLocalDateString = (iso?: string | null): string | null => {
  const d = isoToLocalDate(iso);
  if (!d) return null;

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const getMinutesFromHourStart = (iso?: string | null): number => {
  const d = isoToLocalDate(iso);
  return d ? d.getMinutes() : 0;
};

export const hourLabel = (hour: number) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h.toString().padStart(2, "0")}:00 ${hour < 12 ? "AM" : "PM"}`;
};
