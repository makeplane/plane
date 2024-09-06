import { ConnectionConfiguration } from "@hocuspocus/server";
// services
import { UserService } from "@/core/services/user.service.js";
// types
import { TDocumentTypes } from "@/core/types/common.js";
// plane live lib
import { authenticateUser } from "@/plane-live/lib/authentication.js";
// core helpers
import { manualLogger } from "@/core/helpers/logger.js";

const userService = new UserService();

type Props = {
  connection: ConnectionConfiguration;
  cookie: string;
  params: URLSearchParams;
  token: string;
};

export const handleAuthentication = async (props: Props) => {
  const { connection, cookie, params, token } = props;
  // params
  const documentType = params.get("documentType")?.toString() as
    | TDocumentTypes
    | undefined;
  // fetch current user info
  let response;
  try {
    response = await userService.currentUser(cookie);
  } catch (error) {
    manualLogger.error("Failed to fetch current user:", error);
    throw error;
  }
  if (response.id !== token) {
    throw Error("Authentication failed: Token doesn't match the current user.");
  }

  if (documentType === "project_page") {
    // params
    const workspaceSlug = params.get("workspaceSlug")?.toString();
    const projectId = params.get("projectId")?.toString();
    if (!workspaceSlug || !projectId) {
      throw Error(
        "Authentication failed: Incomplete query params. Either workspaceSlug or projectId is missing."
      );
    }
    // fetch current user's project membership info
    try {
      const projectMembershipInfo = await userService.getUserProjectMembership(
        workspaceSlug,
        projectId,
        cookie
      );
      const projectRole = projectMembershipInfo.role;
      // make the connection read only for roles lower than a member
      if (projectRole < 15) {
        connection.readOnly = true;
      }
    } catch (error) {
      manualLogger.error("Failed to fetch project membership info:", error);
      throw error;
    }
  } else {
    await authenticateUser({
      connection,
      cookie,
      documentType,
      params,
    });
  }

  return {
    user: {
      id: response.id,
      name: response.display_name,
    },
  };
};
