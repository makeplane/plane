import { ConnectionConfiguration } from "@hocuspocus/server";
// services
import { UserService } from "@/core/services/user.service.js";
// types
import { TDocumentTypes } from "@/core/types/common.js";

const userService = new UserService();

type TArgs = {
  connection: ConnectionConfiguration
  cookie: string;
  documentType: TDocumentTypes | undefined;
  params: URLSearchParams;
}

export const authenticateUser = async (args: TArgs): Promise<void> => {
  const { connection, cookie, documentType, params } = args;

  if (documentType === "workspace_page") {
    // params
    const workspaceSlug = params.get("workspaceSlug")?.toString();
    if (!workspaceSlug) {
      throw Error(
        "Authentication failed: Incomplete query params. workspaceSlug is missing."
      );
    }
    // fetch current user's workspace membership info
    const workspaceMembershipInfo = await userService.getUserWorkspaceMembership(
      workspaceSlug,
      cookie
    );
    const workspaceRole = workspaceMembershipInfo.role;
    // make the connection read only for roles lower than a member
    if (workspaceRole < 15) {
      connection.readOnly = true;
    }
  } else {
    throw Error(`Authentication failed: Invalid document type ${documentType} provided.`);
  }
}