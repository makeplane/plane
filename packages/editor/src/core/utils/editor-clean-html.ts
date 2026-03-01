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

/**
 * Clean the editor HTML
 * @param html - The editor HTML
 * @returns The cleaned HTML
 */
export const cleanEditorHTML = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const elements = doc.querySelectorAll("[data-pm-slice]");
  if (elements.length > 0) {
    elements.forEach((el) => {
      el.removeAttribute("data-pm-slice");
    });
  }

  return doc.body.innerHTML;
};
