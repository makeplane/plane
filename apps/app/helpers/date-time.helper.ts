export const renderDateFormat = (date: string | Date | null) => {
  if (!date) return "N/A";

  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};

export const renderShortNumericDateFormat = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-UK", {
    day: "numeric",
    month: "short",
  });

export const renderLongDetailDateFormat = (date: string | Date) =>
  new Date(date).toLocaleDateString("en-UK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const findHowManyDaysLeft = (date: string | Date) => {
  const today = new Date();
  const eventDate = new Date(date);
  const timeDiff = Math.abs(eventDate.getTime() - today.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export const getDatesInRange = (startDate: string | Date, endDate: string | Date) => {
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  const date = new Date(startDate.getTime());
  const dates = [];

  while (date <= endDate) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return dates;
};

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

  var time_formats = [
    [60, "seconds", 1], // 60
    [120, "1 minute ago", "1 minute from now"], // 60*2
    [3600, "minutes", 60], // 60*60, 60
    [7200, "1 hour ago", "1 hour from now"], // 60*60*2
    [86400, "hours", 3600], // 60*60*24, 60*60
    [172800, "Yesterday", "Tomorrow"], // 60*60*24*2
    [604800, "days", 86400], // 60*60*24*7, 60*60*24
    [1209600, "Last week", "Next week"], // 60*60*24*7*4*2
    [2419200, "weeks", 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, "Last month", "Next month"], // 60*60*24*7*4*2
    [29030400, "months", 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, "Last year", "Next year"], // 60*60*24*7*4*12*2
    [2903040000, "years", 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, "Last century", "Next century"], // 60*60*24*7*4*12*100*2
    [58060800000, "centuries", 2903040000], // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
  ];

  var seconds = (+new Date() - time) / 1000,
    token = "ago",
    list_choice = 1;

  if (seconds == 0) {
    return "Just now";
  }
  if (seconds < 0) {
    seconds = Math.abs(seconds);
    token = "from now";
    list_choice = 2;
  }
  var i = 0,
    format;
  while ((format = time_formats[i++]))
    if (seconds < format[0]) {
      if (typeof format[2] == "string") return format[list_choice];
      else return Math.floor(seconds / format[2]) + " " + format[1] + " " + token;
    }
  return time;
};

export const getDateRangeStatus = (
  startDate: string | null | undefined,
  endDate: string | null | undefined
) => {
  if (!startDate || !endDate) return "draft";

  const today = renderDateFormat(new Date());
  const now = new Date(today);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start <= now && end >= now) {
    return "current";
  } else if (start > now) {
    return "upcoming";
  } else {
    return "completed";
  }
};

export const renderShortDateWithYearFormat = (date: string | Date, placeholder?: string) => {
  if (!date || date === "") return null;

  date = new Date(date);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return isNaN(date.getTime()) ? placeholder ?? "N/A" : ` ${month} ${day}, ${year}`;
};

export const renderShortDate = (date: string | Date, placeholder?: string) => {
  if (!date || date === "") return null;

  date = new Date(date);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];

  return isNaN(date.getTime()) ? placeholder ?? "N/A" : `${day} ${month}`;
};

export const renderShortTime = (date: string | Date) => {
  if (!date || date === "") return null;

  date = new Date(date);

  const hours = date.getHours();
  let minutes: any = date.getMinutes();

  // Add leading zero to single-digit minutes
  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  return hours + ":" + minutes;
};

export const isDateRangeValid = (startDate: string, endDate: string) =>
  new Date(startDate) < new Date(endDate);

export const isDateGreaterThanToday = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  return date > today;
};

export const renderLongDateFormat = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const year = date.getFullYear();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthIndex = date.getMonth();
  const monthName = monthNames[monthIndex];
  const suffixes = ["st", "nd", "rd", "th"];
  let suffix = "";
  if (day === 1 || day === 21 || day === 31) {
    suffix = suffixes[0];
  } else if (day === 2 || day === 22) {
    suffix = suffixes[1];
  } else if (day === 3 || day === 23) {
    suffix = suffixes[2];
  } else {
    suffix = suffixes[3];
  }
  return `${day}${suffix} ${monthName} ${year}`;
};
