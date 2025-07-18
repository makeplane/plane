export function formatTimestampToNaturalLanguage(timestamp: string, includeTime: boolean = true): string {
  const date = new Date(timestamp);
  const now = new Date();

  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const timeStr = includeTime ? ` at ${formatTime(date)}` : "";

  // Check if the date is today
  if (diffDays === 0 && now.getDate() === date.getDate()) {
    return `Today${timeStr}`;
  }

  // Check if the date is yesterday
  if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) {
    return `Yesterday${timeStr}`;
  }

  // Format the date as "Month Day, Year"
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return `${date.toLocaleDateString(undefined, options)}${timeStr}`;
}

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

export function formatDateToYYYYMMDD(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
