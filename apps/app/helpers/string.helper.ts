export const addSpaceIfCamelCase = (str: string) => str.replace(/([a-z])([A-Z])/g, "$1 $2");

export const replaceUnderscoreIfSnakeCase = (str: string) => str.replace(/_/g, " ");

export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const truncateText = (str: string, length: number) => {
  if (!str || str === "") return "";

  return str.length > length ? `${str.substring(0, length)}...` : str;
};

export const createSimilarString = (str: string) => {
  const shuffled = str
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return shuffled;
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
  } catch (err) {}

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

export const generateRandomColor = (string: string): string => {
  if (!string) return "rgb(var(--color-primary-100))";

  string = `${string}`;

  const uniqueId = string.length.toString() + string; // Unique identifier based on string length
  const combinedString = uniqueId + string;

  const hash = Array.from(combinedString).reduce((acc, char) => {
    const charCode = char.charCodeAt(0);
    return (acc << 5) - acc + charCode;
  }, 0);

  const hue = hash % 360;
  const saturation = 70; // Higher saturation for pastel colors
  const lightness = 60; // Mid-range lightness for pastel colors

  const randomColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return randomColor;
};

export const getFirstCharacters = (str: string) => {
  const words = str.trim().split(" ");
  if (words.length === 1) {
    return words[0].charAt(0);
  } else {
    return words[0].charAt(0) + words[1].charAt(0);
  }
};

/**
 * @description: This function will remove all the HTML tags from the string
 * @param {string} html
 * @return {string}
 * @example:
 * const html = "<p>Some text</p>";
 * const text = stripHTML(html);
 * console.log(text); // Some text
 */

export const stripHTML = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

/**
 * @description: This function return number count in string if number is more than 100 then it will return 99+
 * @param {number} number
 * @return {string}
 * @example:
 * const number = 100;
 * const text = getNumberCount(number);
 * console.log(text); // 99+
 */

export const getNumberCount = (number: number): string => {
  if (number > 99) {
    return "99+";
  }
  return number.toString();
};
