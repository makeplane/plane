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

import { DEFAULT_BACKGROUND_COLORS } from "@plane/constants";

export const getRandomBackgroundColor = () =>
  DEFAULT_BACKGROUND_COLORS[Math.floor(Math.random() * DEFAULT_BACKGROUND_COLORS.length)];

/**
 * Args for the generic set-default work item type utility.
 * Each caller supplies its own resolution and mutation callbacks so the
 * core optimistic-swap logic doesn't need to know about store internals.
 */
export type TSetDefaultWorkItemTypeArgs<T> = {
  getCurrentDefault: () => T | undefined;
  getById: (typeId: string) => T | undefined;
  isDefault: (type: T) => boolean;
  localUpdate: (type: T, isDefault: boolean) => void;
  syncUpdate: (type: T) => Promise<void>;
};

/**
 * Generic optimistic set-default for work item types.
 *
 * 1. Validates the target exists and isn't already the default.
 * 2. Optimistically unsets the old default locally.
 * 3. Syncs the new default to the server.
 * 4. Rolls back the old default on failure.
 */
export const setDefaultWorkItemType = async <T>(
  typeId: string,
  args: TSetDefaultWorkItemTypeArgs<T>
): Promise<void> => {
  const newDefault = args.getById(typeId);
  if (!newDefault) throw new Error("Work item type not found");
  if (args.isDefault(newDefault)) return;

  const currentDefault = args.getCurrentDefault();
  if (currentDefault) {
    args.localUpdate(currentDefault, false);
  }

  try {
    await args.syncUpdate(newDefault);
  } catch (error) {
    if (currentDefault) {
      args.localUpdate(currentDefault, true);
    }
    throw error;
  }
};
