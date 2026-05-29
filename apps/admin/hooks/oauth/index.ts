import type { TInstanceAuthenticationModes } from "@plane/types";
import { getCoreAuthenticationModesMap } from "./core";
import type { TGetAuthenticationModeProps } from "./types";

export const useAuthenticationModes = (props: TGetAuthenticationModeProps): TInstanceAuthenticationModes[] => {
  // derived values
  const authenticationModes = getCoreAuthenticationModesMap(props);

  const availableAuthenticationModes: TInstanceAuthenticationModes[] = [
    authenticationModes["unique-codes"],
    authenticationModes["passwords-login"],
    authenticationModes["google"],
    authenticationModes["github"],
    authenticationModes["gitlab"],
    authenticationModes["gitea"],
  ];

  return availableAuthenticationModes;
};
