import { getCredentialsBySourceToken } from "@/db/query";

export const getCredentialsForTargetToken = async (targetToken: string) => {
  const credentials = await getCredentialsBySourceToken(targetToken);

  if (!credentials || credentials.length === 0) {
    throw new Error("No credentials found for installation id");
  }

  const planeCredentials = credentials[0];

  if (!planeCredentials.target_access_token) {
    throw new Error("No target access token found for installation id");
  }

  return planeCredentials;
};
