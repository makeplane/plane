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

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getMinutesFromHourStart = (iso?: string | null): number => {
  const d = isoToLocalDate(iso);
  return d ? d.getMinutes() : 0;
};

export const hourLabel = (hour: number) => {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h.toString().padStart(2, "0")}:00 ${hour < 12 ? "AM" : "PM"}`;
};

export const formatCalendarIssueDateTime = (startDate?: string | null, startTime?: string | null): string => {
  const dateParts = startDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateParts) return "";

  const [, yearValue, monthValue, dayValue] = dateParts;
  const year = Number(yearValue);
  const month = Number(monthValue) - 1;
  const day = Number(dayValue);
  const date = new Date(year, month, day);

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return "";

  const dateLabel = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (!startTime) return dateLabel;

  const time = new Date(startTime);
  if (Number.isNaN(time.getTime())) return dateLabel;

  const timeLabel = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateLabel} · ${timeLabel}`;
};
