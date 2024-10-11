import DOMPurify from "isomorphic-dompurify";
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  VIEW_ISSUES,
} from "@/constants/fetch-keys";

export const addSpaceIfCamelCase = (str: string) => {
  if (str === undefined || str === null) return "";

  if (typeof str !== "string") str = `${str}`;

  return str.replace(/([a-z])([A-Z])/g, "$1 $2");
};

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
  const textArea = document.createElement("textarea");
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
    document.execCommand("copy");
  } catch (err) {
    // catch fallback error
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

/**
 * @description: This function copies the url to clipboard after prepending the origin URL to it
 * @param {string} path
 * @example:
 * const text = copyUrlToClipboard("path");
 * copied URL: origin_url/path
 */
export const copyUrlToClipboard = async (path: string) => {
  const originUrl = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

  await copyTextToClipboard(`${originUrl}/${path}`);
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

export const sanitizeHTML = (htmlString: string) => {
  const sanitizedText = DOMPurify.sanitize(htmlString, { ALLOWED_TAGS: [] }); // sanitize the string to remove all HTML tags
  return sanitizedText.trim(); // trim the string to remove leading and trailing whitespaces
};

/**
 *
 * @example:
 * const html = "<p>Some text</p>";
 * const text = stripAndTruncateHTML(html);
 * console.log(text); // Some text
 */

export const stripAndTruncateHTML = (html: string, length: number = 55) => truncateText(sanitizeHTML(html), length);

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

export const objToQueryParams = (obj: any) => {
  const params = new URLSearchParams();

  if (!obj) return params.toString();

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) params.append(key, value as string);
  }

  return params.toString();
};

export const getFetchKeysForIssueMutation = (options: {
  cycleId?: string | string[];
  moduleId?: string | string[];
  viewId?: string | string[];
  projectId: string;
  viewGanttParams: any;
  ganttParams: any;
}) => {
  const { cycleId, moduleId, viewId, projectId, viewGanttParams, ganttParams } = options;

  const ganttFetchKey = cycleId
    ? { ganttFetchKey: CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), ganttParams) }
    : moduleId
      ? { ganttFetchKey: MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), ganttParams) }
      : viewId
        ? { ganttFetchKey: VIEW_ISSUES(viewId.toString(), viewGanttParams) }
        : { ganttFetchKey: PROJECT_ISSUES_LIST_WITH_PARAMS(projectId?.toString() ?? "", ganttParams) };

  return {
    ...ganttFetchKey,
  };
};

/**
 * @returns {boolean} true if searchQuery is substring of text in the same order, false otherwise
 * @description Returns true if searchQuery is substring of text in the same order, false otherwise
 * @param {string} text string to compare from
 * @param {string} searchQuery
 * @example substringMatch("hello world", "hlo") => true
 * @example substringMatch("hello world", "hoe") => false
 */
export const substringMatch = (text: string, searchQuery: string): boolean => {
  try {
    let searchIndex = 0;

    for (let i = 0; i < text.length; i++) {
      if (text[i].toLowerCase() === searchQuery[searchIndex]?.toLowerCase()) searchIndex++;

      // All characters of searchQuery found in order
      if (searchIndex === searchQuery.length) return true;
    }

    // Not all characters of searchQuery found in order
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * @returns {boolean} true if email is valid, false otherwise
 * @description Returns true if email is valid, false otherwise
 * @param {string} email string to check if it is a valid email
 * @example checkEmailIsValid("hello world") => false
 * @example checkEmailIsValid("example@plane.so") => true
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
  // Remove HTML tags using regex
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
  // regex to match valid URLs (with or without http/https)
  const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z]{2,6})(\/[\w.-]*)*\/?(\?[=&\w.-]*)?$/i;
  // test if the URL matches the pattern
  return urlPattern.test(url);
};
