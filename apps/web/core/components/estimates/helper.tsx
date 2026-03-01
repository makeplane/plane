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

import { E_FEATURE_FLAGS } from "@plane/constants";
import type { TEstimateSystemKeys } from "@plane/types";
import { EEstimateSystem } from "@plane/types";
import { store } from "@/lib/store-context";

export const isEstimateSystemEnabled = (key: TEstimateSystemKeys) => {
  const isTimeEnabled = store.featureFlags.getFeatureFlagForCurrentWorkspace(E_FEATURE_FLAGS.TIME_ESTIMATES, false);

  switch (key) {
    case EEstimateSystem.POINTS:
      return true;
    case EEstimateSystem.CATEGORIES:
      return true;
    case EEstimateSystem.TIME:
      return isTimeEnabled;
    default:
      return false;
  }
};
