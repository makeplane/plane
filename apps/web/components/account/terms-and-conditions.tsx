/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { EAuthModes } from "@plane/constants";

interface TermsAndConditionsProps {
  authType?: EAuthModes;
}

/**
 * Xplication: upstream links Plane's own Terms of Service and Privacy Policy here. This
 * deployment has no legal pages of its own yet, so nothing is rendered; add links here
 * once it does.
 */
export function TermsAndConditions(_props: TermsAndConditionsProps) {
  return null;
}
