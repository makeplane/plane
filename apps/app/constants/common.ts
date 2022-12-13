import { NestedKeyOf } from "types";

export const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

export const renderDateFormat = (date: string | Date) => {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};

export const renderShortNumericDateFormat = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-UK", {
    day: "numeric",
    month: "short",
  });
};

export const groupBy = (array: any[], key: string) => {
  const innerKey = key.split("."); // split the key by dot
  return array.reduce((result, currentValue) => {
    const key = innerKey.reduce((obj, i) => obj[i], currentValue); // get the value of the inner key
    (result[key] = result[key] || []).push(currentValue);
    return result;
  }, {});
};

export const orderArrayBy = (
  array: any[],
  key: string,
  ordering: "ascending" | "descending" = "ascending"
) => {
  const innerKey = key.split("."); // split the key by dot
  return array.sort((a, b) => {
    const keyA = innerKey.reduce((obj, i) => obj[i], a); // get the value of the inner key
    const keyB = innerKey.reduce((obj, i) => obj[i], b); // get the value of the inner key
    if (keyA < keyB) {
      return ordering === "ascending" ? -1 : 1;
    }
    if (keyA > keyB) {
      return ordering === "ascending" ? 1 : -1;
    }
    return 0;
  });
};

export const findHowManyDaysLeft = (date: string | Date) => {
  const today = new Date();
  const eventDate = new Date(date);
  const timeDiff = Math.abs(eventDate.getTime() - today.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
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

export const debounce = (func: any, wait: number, immediate: boolean = false) => {
  let timeout: any;
  return function executedFunction(...args: any) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
};

export const addSpaceIfCamelCase = (str: string) => {
  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
};

export const replaceUnderscoreIfSnakeCase = (str: string) => {
  return str.replace(/_/g, " ");
};

const fallbackCopyTextToClipboard = (text: string) => {
  var textArea = document.createElement("textarea");
  textArea.value = text;

  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    // FIXME: Even though we are using this as a fallback, execCommand is deprecated 👎. We should find a better way to do this.
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
    var successful = document.execCommand("copy");
    var msg = successful ? "successful" : "unsuccessful";
    console.log("Fallback: Copying text command was " + msg);
  } catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
  }

  document.body.removeChild(textArea);
};
export const copyTextToClipboard = async (text: string) => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  await navigator.clipboard.writeText(text);
};

const wordsVector = (str: string) => {
  const words = str.split(" ");
  const vector: any = {};
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (vector[word]) {
      vector[word] += 1;
    } else {
      vector[word] = 1;
    }
  }
  return vector;
};

export const cosineSimilarity = (a: string, b: string) => {
  const vectorA = wordsVector(a.trim());
  const vectorB = wordsVector(b.trim());

  const vectorAKeys = Object.keys(vectorA);
  const vectorBKeys = Object.keys(vectorB);

  const union = vectorAKeys.concat(vectorBKeys);

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < union.length; i++) {
    const key = union[i];
    const valueA = vectorA[key] || 0;
    const valueB = vectorB[key] || 0;
    dotProduct += valueA * valueB;
    magnitudeA += valueA * valueA;
    magnitudeB += valueB * valueB;
  }

  return dotProduct / Math.sqrt(magnitudeA * magnitudeB);
};

export const createSimilarString = (str: string) => {
  const shuffled = str
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return shuffled;
};
