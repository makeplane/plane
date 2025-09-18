import LinearService, { LinearProps } from "./api.service";
import { LinearAuth } from "./auth.service";

export const createLinearAuthService = (
  clientId: string = "",
  clientSecret: string = "",
  callbackURL: string
): LinearAuth => {
  if (!clientId || !clientSecret) {
    console.error("[LINEAR] Client ID and client secret are required");
  }
  return new LinearAuth({
    clientId,
    clientSecret,
    callbackURL,
  });
};

export const createLinearService = (props: LinearProps): LinearService => new LinearService(props);
