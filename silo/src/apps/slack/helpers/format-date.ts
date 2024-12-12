export function formatTimestampToNaturalLanguage(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Calculate the difference in days
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Check if the date is today
  if (diffDays === 0 && now.getDate() === date.getDate()) {
    return `Today at ${formatTime(date)}`;
  }

  // Check if the date is yesterday
  if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) {
    return `Yesterday at ${formatTime(date)}`;
  }

  // Format the date as "Month Day, Year"
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return `${date.toLocaleDateString(undefined, options)} at ${formatTime(date)}`;
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
