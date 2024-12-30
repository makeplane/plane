import DOMPurify from "isomorphic-dompurify";

/**
 * @description Adds space between camelCase words
 * @param {string} str - String to add spaces to
 * @returns {string} String with spaces between camelCase words
 * @example
 * addSpaceIfCamelCase("camelCase") // returns "camel Case"
 * addSpaceIfCamelCase("thisIsATest") // returns "this Is A Test"
 */
export const addSpaceIfCamelCase = (str: string) => {
  if (str === undefined || str === null) return "";

  if (typeof str !== "string") str = `${str}`;

  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
};

/**
 * @description Replaces underscores with spaces in snake_case strings
 * @param {string} str - String to replace underscores in
 * @returns {string} String with underscores replaced by spaces
 * @example
 * replaceUnderscoreIfSnakeCase("snake_case") // returns "snake case"
 */
export const replaceUnderscoreIfSnakeCase = (str: string) => str.replace(/_/g, " ");

/**
 * @description Truncates text to specified length and adds ellipsis
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated string with ellipsis if needed
 * @example
 * truncateText("This is a long text", 7) // returns "This is..."
 */
export const truncateText = (str: string, length: number) => {
  if (!str || str === "") return "";

  return str.length > length ? `${str.substring(0, length)}...` : str;
};

/**
 * @description Creates a similar string by randomly shuffling characters
 * @param {string} str - String to shuffle
 * @returns {string} Shuffled string with same characters
 * @example
 * createSimilarString("hello") // might return "olleh" or "lehol"
 */
export const createSimilarString = (str: string) => {
  const shuffled = str
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return shuffled;
};

/**
 * @description Copies full URL (origin + path) to clipboard
 * @param {string} path - URL path to copy
 * @returns {Promise<void>} Promise that resolves when copying is complete
 * @example
 * await copyUrlToClipboard("issues/123") // copies "https://example.com/issues/123"
 */
/**
 * @description Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>} Promise that resolves when copying is complete
 * @example
 * await copyTextToClipboard("Hello, World!") // copies "Hello, World!" to clipboard
 */
export const copyTextToClipboard = async (text: string): Promise<void> => {
  if (typeof navigator === "undefined") return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};

/**
 * @description Copies full URL (origin + path) to clipboard
 * @param {string} path - URL path to copy
 * @returns {Promise<void>} Promise that resolves when copying is complete
 * @example
 * await copyUrlToClipboard("issues/123") // copies "https://example.com/issues/123"
 */
export const copyUrlToClipboard = async (path: string) => {
  const originUrl = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
  await copyTextToClipboard(`${originUrl}/${path}`);
};

/**
 * @description Generates a deterministic HSL color based on input string
 * @param {string} string - Input string to generate color from
 * @returns {string} HSL color string
 * @example
 * generateRandomColor("hello") // returns consistent HSL color for "hello"
 * generateRandomColor("") // returns "rgb(var(--color-primary-100))"
 */
export const generateRandomColor = (string: string): string => {
  if (!string) return "rgb(var(--color-primary-100))";

  string = `${string}`;

  const uniqueId = string.length.toString() + string;
  const combinedString = uniqueId + string;

  const hash = Array.from(combinedString).reduce((acc, char) => {
    const charCode = char.charCodeAt(0);
    return (acc << 5) - acc + charCode;
  }, 0);

  const hue = hash % 360;
  const saturation = 70;
  const lightness = 60;

  const randomColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return randomColor;
};

/**
 * @description Gets first character of first word or first characters of first two words
 * @param {string} str - Input string
 * @returns {string} First character(s)
 * @example
 * getFirstCharacters("John") // returns "J"
 * getFirstCharacters("John Doe") // returns "JD"
 */
export const getFirstCharacters = (str: string) => {
  const words = str.trim().split(" ");
  if (words.length === 1) {
    return words[0].charAt(0);
  } else {
    return words[0].charAt(0) + words[1].charAt(0);
  }
};

/**
 * @description Formats number count, showing "99+" for numbers over 99
 * @param {number} number - Number to format
 * @returns {string} Formatted number string
 * @example
 * getNumberCount(50) // returns "50"
 * getNumberCount(100) // returns "99+"
 */
export const getNumberCount = (number: number): string => {
  if (number > 99) {
    return "99+";
  }
  return number.toString();
};

/**
 * @description Converts object to URL query parameters string
 * @param {Object} obj - Object to convert
 * @returns {string} URL query parameters string
 * @example
 * objToQueryParams({ page: 1, search: "test" }) // returns "page=1&search=test"
 * objToQueryParams({ a: null, b: "test" }) // returns "b=test"
 */
export const objToQueryParams = (obj: any) => {
  const params = new URLSearchParams();

  if (!obj) return params.toString();

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) params.append(key, value as string);
  }

  return params.toString();
};

/**
 * @description: This function will capitalize the first letter of a string
 * @param str String
 * @returns String
 */
export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * @description: This function will remove all the HTML tags from the string
 * @param {string} html
 * @return {string}
 * @example:
 * const html = "<p>Some text</p>";
 * const text = stripHTML(html);
 * console.log(text); // Some text
 */
/**
 * @description Sanitizes HTML string by removing tags and properly escaping entities
 * @param {string} htmlString - HTML string to sanitize
 * @returns {string} Sanitized string with escaped HTML entities
 * @example
 * sanitizeHTML("<p>Hello & 'world'</p>") // returns "Hello &amp; &apos;world&apos;"
 */
export const sanitizeHTML = (htmlString: string) => {
  if (!htmlString) return "";

  // First use DOMPurify to remove all HTML tags while preserving text content
  const sanitizedText = DOMPurify.sanitize(htmlString, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    USE_PROFILES: {
      html: false,
      svg: false,
      svgFilters: false,
      mathMl: false,
    },
  });

  // Additional escaping for quotes and apostrophes
  return sanitizedText.trim().replace(/'/g, "&apos;").replace(/"/g, "&quot;");
};

/**
 * @returns {boolean} true if email is valid, false otherwise
 * @description Returns true if email is valid, false otherwise
 * @param {string} email string to check if it is a valid email
 * @example checkEmailValidity("hello world") => false
 * @example checkEmailValidity("example@plane.so") => true
 */
export const checkEmailValidity = (email: string): boolean => {
  if (!email) return false;

  const isEmailValid =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    );

  return isEmailValid;
};

export const isEmptyHtmlString = (htmlString: string, allowedHTMLTags: string[] = []) => {
  // Remove HTML tags using DOMPurify
  const cleanText = DOMPurify.sanitize(htmlString, { ALLOWED_TAGS: allowedHTMLTags });
  // Trim the string and check if it's empty
  return cleanText.trim() === "";
};

/**
 * @description this function returns whether a comment is empty or not by checking for the following conditions-
 * 1. If comment is undefined
 * 2. If comment is an empty string
 * 3. If comment is "<p></p>"
 * @param {string | undefined} comment
 * @returns {boolean}
 */
export const isCommentEmpty = (comment: string | undefined): boolean => {
  // return true if comment is undefined
  if (!comment) return true;
  return (
    comment?.trim() === "" ||
    comment === "<p></p>" ||
    isEmptyHtmlString(comment ?? "", ["img", "mention-component", "image-component"])
  );
};

/**
 * @description
 * This function test whether a URL is valid or not.
 *
 * It accepts URLs with or without the protocol.
 * @param {string} url
 * @returns {boolean}
 * @example
 * checkURLValidity("https://example.com") => true
 * checkURLValidity("example.com") => true
 * checkURLValidity("example") => false
 */
export const checkURLValidity = (url: string): boolean => {
  if (!url) return false;

  // regex to support complex query parameters and fragments
  const urlPattern =
    /^(https?:\/\/)?((([a-z\d-]+\.)*[a-z\d-]+\.[a-z]{2,6})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(:\d+)?(\/[\w.-]*)*(\?[^#\s]*)?(#[\w-]*)?$/i;

  return urlPattern.test(url);
};

// Browser-only clipboard functions
// let copyTextToClipboard: (text: string) => Promise<void>;

// if (typeof window !== "undefined") {
//   const fallbackCopyTextToClipboard = (text: string) => {
//     const textArea = document.createElement("textarea");
//     textArea.value = text;

//     // Avoid scrolling to bottom
//     textArea.style.top = "0";
//     textArea.style.left = "0";
//     textArea.style.position = "fixed";

//     document.body.appendChild(textArea);
//     textArea.focus();
//     textArea.select();

//     try {
//       // FIXME: Even though we are using this as a fallback, execCommand is deprecated 👎. We should find a better way to do this.
//       // https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
//       document.execCommand("copy");
//     } catch (err) {}

//     document.body.removeChild(textArea);
//   };

//   copyTextToClipboard = async (text: string) => {
//     if (!navigator.clipboard) {
//       fallbackCopyTextToClipboard(text);
//       return;
//     }
//     await navigator.clipboard.writeText(text);
//   };
// } else {
//   copyTextToClipboard = async () => {
//     throw new Error("copyTextToClipboard is only available in browser environments");
//   };
// }

// export { copyTextToClipboard };
