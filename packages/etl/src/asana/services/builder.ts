import { AsanaServiceProps } from "@/asana/types";
import AsanaService from "./api.service";
import { AsanaAuth } from "./auth.service";

export const createAsanaAuthService = (clientId: string = "", clientSecret: string = "", callbackURL: string) => {
  if (!clientId || !clientSecret) {
    console.error("[ASANA] Client ID and client secret are required");
  }
  return new AsanaAuth({ clientId, clientSecret, callbackURL });
};

export const createAsanaService = (props: AsanaServiceProps) => new AsanaService(props);
