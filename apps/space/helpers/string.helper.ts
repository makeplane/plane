/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

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
  } catch (_err) {}

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
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    );

  return isEmailValid;
};

export const replaceUnderscoreIfSnakeCase = (str: string) => str.replace(/_/g, " ");

export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

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

/**
 * @returns {string} The `mailto:` URL for reporting a Space page to Plane support.
 * @param anchor — Space page anchor (slug)
 * @param reason — report reason
 * @param description — details of the issue
 */
export const createReportPageEmailLink = (anchor: string, reason: string, description: string): string => {
  const SUPPORT_EMAIL = "support@plane.so";

  const subject = `[Plane Space] Report page: ${reason}`;

  const originUrl = typeof window !== "undefined" ? window.location.origin : "";
  const pageLink = new URL(`/spaces/pages/${anchor}/`, originUrl).toString();

  const bodyLines = [
    "Hello Plane Support Team,",
    "",
    "I would like to report a page published on Plane Space. Please find the details below.",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━",
    "  REPORT DETAILS",
    "━━━━━━━━━━━━━━━━━━━━━━━━",
    `  Reason    : ${reason}`,
    `  Page Link : ${pageLink}`,
  ];

  const trimmedDescription = description?.trim();
  if (trimmedDescription)
    bodyLines.push("", "━━━━━━━━━━━━━━━━━━━━━━━━", "  DESCRIPTION", "━━━━━━━━━━━━━━━━━━━━━━━━", trimmedDescription);

  bodyLines.push(
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "Please investigate and take appropriate action.",
    "",
    "Thank you."
  );

  const body = bodyLines.join("\n");

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
