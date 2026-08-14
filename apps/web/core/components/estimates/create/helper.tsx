/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TEstimateSystemKeys } from "@plane/types";
import { EEstimateSystem } from "@plane/types";

/**
 * Whether an estimate system is usable in the current deployment.
 *
 * The TIME system is fully implemented in the product (backend supports the
 * "time" estimate type and the estimate machinery round-trips it) but is still
 * gated as an EE-only feature for cloud commercial deployments. The self-hosted
 * Community edition applies no commercial feature gates, so TIME is enabled
 * there.
 */
export const isEstimateSystemEnabled = (key: TEstimateSystemKeys, isSelfHosted = false) => {
  switch (key) {
    case EEstimateSystem.POINTS:
      return true;
    case EEstimateSystem.CATEGORIES:
      return true;
    case EEstimateSystem.TIME:
      return isSelfHosted;
    default:
      return false;
  }
};
