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
 * User color utilities for multi-user diff visualization
 * Uses a predefined palette for consistent, accessible colors
 */

export type UserColor = {
  solid: string; // Main indicator color
  lightBg: string; // Background color for light mode
  darkBg: string; // Background color for dark mode
  // y-prosemirror compatibility - it expects light/dark naming
  light: string; // Alias for lightBg (for y-prosemirror colorMapping)
  dark: string; // Alias for solid (for y-prosemirror colorMapping)
};

type PaletteColor = {
  solid: string;
  lightBg: string;
  darkBg: string;
};

const USER_COLOR_PALETTE: PaletteColor[] = [
  { solid: "#DB3E33", lightBg: "#FBEAE9", darkBg: "#3D0E0B" }, // User 1 - Red
  { solid: "#7162BC", lightBg: "#ECEAF6", darkBg: "#1A1532" }, // User 2 - Purple
  { solid: "#BE609A", lightBg: "#F5E6EF", darkBg: "#331527" }, // User 3 - Pink
  { solid: "#E9B035", lightBg: "#FBF2DF", darkBg: "#402E07" }, // User 4 - Yellow
  { solid: "#3B73E3", lightBg: "#E4ECFB", darkBg: "#091B3E" }, // User 5 - Blue
  { solid: "#4DC76F", lightBg: "#E4F6E9", darkBg: "#11361C" }, // User 6 - Green
  { solid: "#FF7614", lightBg: "#FFF0E5", darkBg: "#471E00" }, // User 7 - Orange
];

const hashUserId = (userId: string): number => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * Create a user color from a Plane user ID using a predefined palette.
 * Uses deterministic hashing to ensure the same user always gets the same color.
 *
 * @param userId - The Plane user ID
 * @returns UserColor with solid, lightBg, darkBg, and y-prosemirror compatible light/dark
 */
export const createUserColor = (userId: string): UserColor => {
  const index = hashUserId(userId) % USER_COLOR_PALETTE.length;
  const palette = USER_COLOR_PALETTE[index];
  return {
    ...palette,
    // y-prosemirror expects light (bg) and dark (text) properties
    light: palette.lightBg,
    dark: palette.solid,
  };
};

/**
 * Get a user color from a user ID
 * Uses consistent hashing to ensure the same user always gets the same color
 */
export const getUserColor = (userId: string | null): UserColor => {
  if (!userId) {
    return { solid: "#6b7280", lightBg: "#f3f4f6", darkBg: "#374151", light: "#f3f4f6", dark: "#6b7280" };
  }

  return createUserColor(userId);
};

/**
 * Create a colorMapping Map for ySyncPlugin
 * Maps user IDs to their colors using the same algorithm as the main editor
 * This ensures consistent colors across renders and sessions
 */
export const createColorMapping = (userIds: string[]): Map<string, UserColor> => {
  const mapping = new Map<string, UserColor>();

  userIds.forEach((userId) => {
    if (userId && !mapping.has(userId)) {
      mapping.set(userId, createUserColor(userId));
    }
  });

  return mapping;
};
