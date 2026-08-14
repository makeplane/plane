/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// store hooks
import { useInstance } from "./use-instance";

export type TSelfHostedPolicy = {
  isSelfHosted: boolean;
  hasCommercialGating: boolean;
  seatLimit: number | null;
  isSeatLimited: boolean;
  isFeatureTierUnlimited: boolean;
};

/**
 * Shared, backend-derived self-hosted feature policy.
 *
 * The authoritative policy comes from the instance endpoint
 * (``GET /api/instances/`` -> ``capabilities.policy``). The self-hosted
 * Community edition applies no commercial feature gates and no seat caps
 * (limits are ``null`` = unlimited). Cloud-only plan messaging is suppressed
 * whenever ``hasCommercialGating`` is false.
 */
export const useSelfHostedPolicy = (): TSelfHostedPolicy => {
  const { config, capabilities } = useInstance();

  const policy = capabilities?.policy;
  const isSelfHosted = config?.is_self_managed ?? policy?.self_hosted ?? true;
  const seatLimit = policy?.seat_limit ?? null;

  return {
    isSelfHosted,
    hasCommercialGating: !isSelfHosted && policy?.commercial_gating === true,
    seatLimit,
    isSeatLimited: seatLimit !== null,
    isFeatureTierUnlimited: isSelfHosted && policy?.feature_tier === "unlimited",
  };
};
