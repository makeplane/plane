import { JiraProps } from "@/types";
import { JiraAuth } from "./auth.service";
import JiraService from "./api.service";

export const createJiraAuth = (
  clientId: string,
  clientSecret: string,
  callbackURL: string,
  authorizeURL: string,
  tokenURL: string
): JiraAuth =>
  new JiraAuth({
    clientId,
    clientSecret,
    callbackURL,
    authorizeURL,
    tokenURL,
  });

export const createJiraService = (props: JiraProps): JiraService =>
  new JiraService(props);
