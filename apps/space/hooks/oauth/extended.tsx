/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// workspaces imports
import type { TOAuthConfigs } from "@workspaces/types";

export const useExtendedOAuthConfig = (_oauthActionText: string): TOAuthConfigs => ({
  isOAuthEnabled: false,
  oAuthOptions: [],
});
