/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TOAuthConfigs } from "@plane/types";
// local imports
import { useCoreOAuthConfig } from "./core";
import { useExtendedOAuthConfig } from "./extended";

export const useOAuthConfig = (oauthActionText: string = "Continue"): TOAuthConfigs => {
  const coreOAuthConfig = useCoreOAuthConfig(oauthActionText);
  const extendedOAuthConfig = useExtendedOAuthConfig(oauthActionText);
  return {
    isOAuthEnabled: coreOAuthConfig.isOAuthEnabled || extendedOAuthConfig.isOAuthEnabled,
    oAuthOptions: [...coreOAuthConfig.oAuthOptions, ...extendedOAuthConfig.oAuthOptions],
  };
};
