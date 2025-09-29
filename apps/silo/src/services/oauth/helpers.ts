import { E_INTEGRATION_KEYS } from "@plane/types";

// Utility function to convert provider string to E_INTEGRATION_KEYS
export const convertProviderToIntegrationKey = (provider: string): E_INTEGRATION_KEYS => {
  // Convert "github" to "GITHUB"
  // Convert "prd-agent" to "PRD_AGENT"
  const normalizedProvider = provider.toUpperCase().replace(/-/g, "_");

  // Validate if the converted value is a valid E_INTEGRATION_KEYS
  if (Object.values(E_INTEGRATION_KEYS).includes(normalizedProvider as E_INTEGRATION_KEYS)) {
    return normalizedProvider as E_INTEGRATION_KEYS;
  }

  throw new Error(`Invalid provider: ${provider}`);
};

export const convertIntegrationKeyToProvider = (integrationKey: E_INTEGRATION_KEYS): string => {
  // Validate if the integration key is a valid E_INTEGRATION_KEYS
  if (!Object.values(E_INTEGRATION_KEYS).includes(integrationKey as E_INTEGRATION_KEYS)) {
    throw new Error(`Invalid integration key: ${integrationKey}`);
  }
  // Convert "GITHUB" to "github"
  // Convert "PRD_AGENT" to "prd-agent"
  const normalizedProvider = integrationKey.toLowerCase().replace(/_/g, "-");

  return normalizedProvider;
};
