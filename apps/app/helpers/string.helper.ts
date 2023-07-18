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
