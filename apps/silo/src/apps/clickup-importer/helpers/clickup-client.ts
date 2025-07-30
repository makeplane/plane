import { ClickupAPIService } from "@plane/etl/clickup";
import { TWorkspaceCredential } from "@plane/types";

export const getClickUpClient = (credentials: TWorkspaceCredential): ClickupAPIService => {
  if (!credentials.source_access_token) {
    throw new Error("No access token found");
  }
  return new ClickupAPIService(credentials.source_access_token);
};
