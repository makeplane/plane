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

import { useContext } from "react";
import { E_FEATURE_FLAGS } from "@plane/constants";
// context
import { StoreContext } from "@/lib/store-context";

export const useAiFlag = (
  workspaceSlug: string | undefined,
  flag: keyof typeof E_FEATURE_FLAGS,
  defaultValue: boolean = false
): boolean => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useFlag must be used within StoreProvider");
  if (!workspaceSlug) return defaultValue;
  return context.aiFeatureFlags.flags[workspaceSlug]?.[E_FEATURE_FLAGS[flag]] ?? defaultValue;
};
