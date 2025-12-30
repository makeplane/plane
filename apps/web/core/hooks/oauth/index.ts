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
