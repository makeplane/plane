// plane imports
import type { TOAuthConfigs } from "@plane/types";

export const useExtendedOAuthConfig = (_oauthActionText: string): TOAuthConfigs => {
  return {
    isOAuthEnabled: false,
    oAuthOptions: [],
  };
};
