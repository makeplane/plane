/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useSelfHostedPolicy } from "@/hooks/store/use-self-hosted-policy";

/**
 * Selection + P4A bulk archive are available whenever this deployment does
 * not apply commercial gating. Self-hosted Community reports
 * ``hasCommercialGating: false`` from ``capabilities.policy``.
 */
export const useBulkOperationStatus = () => {
  const { hasCommercialGating } = useSelfHostedPolicy();
  return !hasCommercialGating;
};
