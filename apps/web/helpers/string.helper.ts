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

// Utility functions for data transformation
export const parseCommaSeparatedList = (input: string): string[] | null => {
  const parsed = input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : null;
};

export const parseJsonSafely = <T>(input: string): T | null => {
  if (!input.trim()) return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};

export const stringifyJsonSafely = (input: Record<string, any> | null | undefined): string => {
  return input ? JSON.stringify(input, null, 2) : "";
};
