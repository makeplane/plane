/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { IncomingHttpHeaders } from "http";
import type { TUserDetails } from "@plane/editor";
import { logger } from "@plane/logger";
import { AppError } from "@/lib/errors";
// services
import { UserService } from "@/services/user.service";
// types
import type { HocusPocusServerContext, TDocumentTypes } from "@/types";

// Only user document types may open a socket; any other type is set in-process, never by a client.
const USER_DOCUMENT_TYPES: ReadonlySet<string> = new Set<TDocumentTypes>(["project_page"]);

/**
 * Authenticate the user
 * @param requestHeaders - The request headers
 * @param context - The context
 * @param token - The token
 * @returns The authenticated user
 */
export const onAuthenticate = async ({
  requestHeaders,
  requestParameters,
  context,
  token,
  documentName,
  connectionConfig,
}: {
  requestHeaders: IncomingHttpHeaders;
  context: HocusPocusServerContext;
  requestParameters: URLSearchParams;
  token: string;
  documentName: string;
  connectionConfig: { readOnly: boolean };
}) => {
  let cookie: string | undefined = undefined;
  let userId: string | undefined = undefined;

  // Extract cookie (fallback to request headers) and userId from token (for scenarios where
  // the cookies are not passed in the request headers)
  try {
    const parsedToken = JSON.parse(token) as TUserDetails;
    userId = parsedToken.id;
    cookie = parsedToken.cookie;
  } catch (error) {
    const appError = new AppError(error, {
      context: { operation: "onAuthenticate" },
    });
    logger.error("Token parsing failed, using request headers", appError);
  } finally {
    // If cookie is still not found, fallback to request headers
    if (!cookie) {
      cookie = requestHeaders.cookie?.toString();
    }
  }

  if (!cookie || !userId) {
    const appError = new AppError("Credentials not provided", { code: "AUTH_MISSING_CREDENTIALS" });
    logger.error("Credentials not provided", appError);
    throw appError;
  }

  const documentType = requestParameters.get("documentType");
  if (!documentType || !USER_DOCUMENT_TYPES.has(documentType)) {
    const appError = new AppError("Invalid document type", { code: "AUTH_INVALID_DOCUMENT_TYPE" });
    logger.error("Invalid document type", appError);
    throw appError;
  }

  // set cookie in context, so it can be used throughout the ws connection
  context.cookie = cookie ?? requestParameters.get("cookie") ?? "";
  context.documentType = documentType as TDocumentTypes;
  context.userId = userId;
  context.workspaceSlug = requestParameters.get("workspaceSlug");

  const authenticated = await handleAuthentication({
    cookie: context.cookie,
    userId: context.userId,
  });

  // Hocuspocus loads a document once and hands it to every later connection without fetching it again, so the
  // first loader's fetch checks no one else: every connection must prove its own access to the page. The project
  // comes from the checked page, never from the socket.
  const access = await authorizePage(context, documentName);
  connectionConfig.readOnly = access.read_only;
  context.projectId = access.project_id;

  return authenticated;
};

/**
 * Checks the user's access to the page with their own cookie.
 * @returns the page's project, and whether the connection must be read-only
 */
const authorizePage = async (
  context: HocusPocusServerContext,
  pageId: string
): Promise<{ project_id: string; read_only: boolean }> => {
  let access: { project_id: string; read_only?: boolean };
  try {
    access = await new UserService().getPageAccess(context.cookie, context.workspaceSlug ?? "", pageId, "view");
  } catch (error) {
    const appError = new AppError(error, { context: { operation: "authorizePage", pageId } });
    logger.error("Page authorization failed", appError);
    // Django denies with a 404; an outage also refuses the connection, under its own code.
    throw new AppError("Page access denied", {
      code: appError.statusCode === 404 ? "AUTH_PAGE_ACCESS_DENIED" : appError.code,
    });
  }
  // An API older than this check gives no answer; refuse visibly rather than open a read-only socket that drops edits.
  if (typeof access.read_only !== "boolean") {
    throw new AppError("Page access unknown", { code: "AUTH_PAGE_ACCESS_UNKNOWN" });
  }
  return { project_id: access.project_id, read_only: access.read_only };
};

export const handleAuthentication = async ({ cookie, userId }: { cookie: string; userId: string }) => {
  // fetch current user info
  try {
    const userService = new UserService();
    const user = await userService.currentUser(cookie);
    if (user.id !== userId) {
      throw new AppError("Authentication unsuccessful: User ID mismatch", { code: "AUTH_USER_MISMATCH" });
    }

    return {
      user: {
        id: user.id,
        name: user.display_name,
      },
    };
  } catch (error) {
    const appError = new AppError(error, {
      context: { operation: "handleAuthentication" },
    });
    logger.error("Authentication failed", appError);
    throw new AppError("Authentication unsuccessful", { code: appError.code });
  }
};
