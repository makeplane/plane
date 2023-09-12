export const timeAgo = (time: any) => {
  switch (typeof time) {
    case "number":
      break;
    case "string":
      time = +new Date(time);
      break;
    case "object":
      if (time.constructor === Date) time = time.getTime();
      break;
    default:
      time = +new Date();
  }
};

/**
 * @description Returns date and month, if date is of the current year
 * @description Returns date, month adn year, if date is of a different year than current
 * @param {string} date
 * @example renderFullDate("2023-01-01") // 1 Jan
 * @example renderFullDate("2021-01-01") // 1 Jan, 2021
 */

export const renderFullDate = (date: string): string => {
  if (!date) return "";

  const months: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const currentDate: Date = new Date();
  const [year, month, day]: number[] = date.split("-").map(Number);

  const formattedMonth: string = months[month - 1];
  const formattedDay: string = day < 10 ? `0${day}` : day.toString();

  if (currentDate.getFullYear() === year) return `${formattedDay} ${formattedMonth}`;
  else return `${formattedDay} ${formattedMonth}, ${year}`;
};
