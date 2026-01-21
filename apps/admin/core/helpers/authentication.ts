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
