import { LinearAuthProps } from "@/types";
import { LinearAuth } from "./auth.service";
import LinearService, { LinearProps } from "./api.service";

export const createLinearAuthService = (props: LinearAuthProps): LinearAuth =>
  new LinearAuth(props);
export const createLinearService = (props: LinearProps): LinearService =>
  new LinearService(props);
