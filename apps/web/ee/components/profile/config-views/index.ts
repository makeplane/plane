import { TUserConnection } from "@plane/constants";
import { TPersonalAccountConnectProps } from "../personal-account-view";
import { SlackConfigView } from "./slack";

export const CONFIG_VIEWS: Record<TUserConnection, React.FC<TPersonalAccountConnectProps> | null> = {
  SLACK: SlackConfigView,
  GITHUB: null,
  GITHUB_ENTERPRISE: null,
};
