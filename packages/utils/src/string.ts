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
      mathMl: false
    }
  });

  // Additional escaping for quotes and apostrophes
  return sanitizedText
    .trim()
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;");
};
