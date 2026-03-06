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

import type {
  IFormattedInstanceConfiguration,
  TInstanceAuthenticationModes,
  TInstanceConfigurationKeys,
} from "@plane/types";

/**
 * Checks if a given authentication method can be disabled.
 * @param configKey - The configuration key to check.
 * @param authModes - The authentication modes to check.
 * @param formattedConfig - The formatted configuration to check.
 * @returns True if the authentication method can be disabled, false otherwise.
 */
export const canDisableAuthMethod = (
  configKey: TInstanceConfigurationKeys,
  authModes: TInstanceAuthenticationModes[],
  formattedConfig: IFormattedInstanceConfiguration | undefined
): boolean => {
  // Count currently enabled methods
  const enabledCount = authModes.reduce((count, method) => {
    const enabledKey = method.enabledConfigKey;
    if (!enabledKey || !formattedConfig) return count;
    const isEnabled = Boolean(parseInt(formattedConfig[enabledKey] ?? "0"));
    return isEnabled ? count + 1 : count;
  }, 0);

  // If trying to disable and only 1 method is enabled, prevent it
  const isCurrentlyEnabled = Boolean(parseInt(formattedConfig?.[configKey] ?? "0"));
  return !(isCurrentlyEnabled && enabledCount === 1);
};

/**
 * Decodes a base64 encoded email from URL parameters.
 * Used to decode the 'ctx' parameter that contains encoded email.
 * @param encodedEmail - The base64 encoded email string
 * @returns The decoded email or undefined if decoding fails
 */
export const decodeEmailFromUrl = (encodedEmail: string | null | undefined): string | undefined => {
  if (!encodedEmail) return undefined;
  try {
    return atob(encodedEmail);
  } catch {
    return undefined;
  }
};
