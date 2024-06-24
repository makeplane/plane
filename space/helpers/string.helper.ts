import DOMPurify from "dompurify";

export const addSpaceIfCamelCase = (str: string) => str.replace(/([a-z])([A-Z])/g, "$1 $2");

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

export const copyTextToClipboard = async (text: string) => {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  await navigator.clipboard.writeText(text);
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

export const isEmptyHtmlString = (htmlString: string) => {
  // Remove HTML tags using regex
  const cleanText = DOMPurify.sanitize(htmlString, { ALLOWED_TAGS: ["img"] });
  // Trim the string and check if it's empty
  return cleanText.trim() === "";
};
