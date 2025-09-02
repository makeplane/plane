import { JiraProps } from "@/jira/types";
import { JiraAuth } from "./auth.service";
import JiraService from "./api.service";

export const createJiraAuth = (
  clientId: string = "",
  clientSecret: string = "",
  callbackURL: string,
  authorizeURL: string,
  tokenURL: string
): JiraAuth => {
  if (!clientId || !clientSecret) {
    console.error("[JIRA] Client ID and client secret are required");
  }
  return new JiraAuth({
    clientId,
    clientSecret,
    callbackURL,
    authorizeURL,
    tokenURL,
  });
};

export const createJiraService = (props: JiraProps): JiraService => new JiraService(props);
