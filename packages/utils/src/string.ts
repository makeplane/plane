import DOMPurify from "isomorphic-dompurify";

export const addSpaceIfCamelCase = (str: string) => str.replace(/([a-z])([A-Z])/g, "$1 $2");

export const replaceUnderscoreIfSnakeCase = (str: string) => str.replace(/_/g, " ");

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
export const sanitizeHTML = (htmlString: string) => {
  const sanitizedText = DOMPurify.sanitize(htmlString, { ALLOWED_TAGS: [] }); // sanitize the string to remove all HTML tags
  return sanitizedText.trim(); // trim the string to remove leading and trailing whitespaces
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
let copyTextToClipboard: (text: string) => Promise<void>;

if (typeof window !== "undefined") {
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
    } catch (err) {}

    document.body.removeChild(textArea);
  };

  copyTextToClipboard = async (text: string) => {
    if (!navigator.clipboard) {
      fallbackCopyTextToClipboard(text);
      return;
    }
    await navigator.clipboard.writeText(text);
  };
} else {
  copyTextToClipboard = async () => {
    throw new Error("copyTextToClipboard is only available in browser environments");
  };
}

export { copyTextToClipboard };
