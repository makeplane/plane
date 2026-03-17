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
/* oxlint-disable */

import type { ExProject } from "@plane/sdk";

export const removeArrayObjSpaces = (arr: any[]) => arr.map((obj) => removeSpacesFromKeys(obj));

export const removeSpacesFromKeys = (obj: any) => {
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = key.replace(/\s+/g, "_").toLowerCase();
    // @ts-expect-error - Ignoring ts error for dynamic key assignment
    newObj[newKey] = value;
  }
  return newObj;
};

export const formatDateStringForHHMM = (inputDate: Date): string => {
  const date = new Date(inputDate);
  // Extract date components
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
  const day = date.getDate().toString().padStart(2, "0");

  // Construct the formatted date string
  const formattedDate = `${year}/${month}/${day}`;

  return formattedDate;
};

export const getFormattedDate = (date: string | undefined): string | undefined => {
  if (date) {
    const dateObj = new Date(date);

    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(dateObj.getUTCDate()).padStart(2, "0");

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }
};

export const getRandomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16);

export const removeUndefinedFromObject = (obj: any): any =>
  Object.fromEntries(Object.entries(obj || {}).filter(([_, value]) => value !== undefined));

// Capitalise the first letters in a string
export const capitalize = (str: string): string => (str.length > 0 ? `${str[0].toUpperCase()}${str.slice(1)}` : "");

// Filter out projects in which user is absent, archived projects from all projects
export const filterUserProjects = (projects: { results?: ExProject[] }): ExProject[] => {
  return projects.results?.filter((project) => project.is_member === true && project.archived_at == null) ?? [];
};
