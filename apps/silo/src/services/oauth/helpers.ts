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

import { E_INTEGRATION_KEYS } from "@plane/types";

export const SUPPORTED_OAUTH_PROVIDERS = [
  E_INTEGRATION_KEYS.BITBUCKET_DC,
  E_INTEGRATION_KEYS.GITHUB_ENTERPRISE,
  E_INTEGRATION_KEYS.GITLAB_ENTERPRISE,
  E_INTEGRATION_KEYS.PRD_AGENT,
  E_INTEGRATION_KEYS.SENTRY,
] as const satisfies readonly E_INTEGRATION_KEYS[];

const SUPPORTED_OAUTH_PROVIDER_SET = new Set<E_INTEGRATION_KEYS>(SUPPORTED_OAUTH_PROVIDERS);

// Utility function to convert provider string to E_INTEGRATION_KEYS
export const convertProviderToIntegrationKey = (provider: string): E_INTEGRATION_KEYS => {
  // Convert "github" to "GITHUB"
  // Convert "prd-agent" to "PRD_AGENT"
  const normalizedProvider = provider.toUpperCase().replace(/-/g, "_");

  // Validate if the converted value is an OAuth-supported integration key
  if (SUPPORTED_OAUTH_PROVIDER_SET.has(normalizedProvider as E_INTEGRATION_KEYS)) {
    return normalizedProvider as E_INTEGRATION_KEYS;
  }

  throw new Error(`Invalid provider: ${provider}`);
};

export const convertIntegrationKeyToProvider = (integrationKey: E_INTEGRATION_KEYS): string => {
  // Validate if the integration key is an OAuth-supported provider
  if (!SUPPORTED_OAUTH_PROVIDER_SET.has(integrationKey)) {
    throw new Error(`Invalid integration key: ${integrationKey}`);
  }
  // Convert "GITHUB" to "github"
  // Convert "PRD_AGENT" to "prd-agent"
  const normalizedProvider = integrationKey.toLowerCase().replace(/_/g, "-");

  return normalizedProvider;
};
