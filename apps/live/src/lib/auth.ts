// plane imports
import type { TUserDetails } from "@plane/editor";
import { DocumentCollaborativeEvents, TDocumentEventsServer } from "@plane/editor/lib";
import { logger } from "@plane/logger";
// services
import { UserService } from "@/services/user.service";
// types
import { HocusPocusServerContext } from "@/types";

/**
 * Authenticate the user
 * @param requestHeaders - The request headers
 * @param context - The context
 * @param token - The token
 * @returns The authenticated user
 */
export const onAuthenticate = async ({ requestHeaders, context, token }: any) => {
  let cookie: string | undefined = undefined;
  let userId: string | undefined = undefined;

  // Extract cookie (fallback to request headers) and userId from token (for scenarios where
  // the cookies are not passed in the request headers)
  try {
    const parsedToken = JSON.parse(token) as TUserDetails;
    userId = parsedToken.id;
    cookie = parsedToken.cookie;
  } catch (error) {
    // If token parsing fails, fallback to request headers
    logger.error("Token parsing failed, using request headers:", error);
  } finally {
    // If cookie is still not found, fallback to request headers
    if (!cookie) {
      cookie = requestHeaders.cookie?.toString();
    }
  }

  if (!cookie || !userId) {
    throw new Error("Credentials not provided");
  }

  // set cookie in context, so it can be used throughout the ws connection
  (context as HocusPocusServerContext).cookie = cookie;

  try {
    const userService = new UserService();
    const user = await userService.currentUser(cookie);
    if (user.id !== userId) {
      throw new Error("Authentication unsuccessful!");
    }

    return {
      user: {
        id: user.id,
        name: user.display_name,
      },
    };
  } catch (_error) {
    throw Error("Authentication unsuccessful!");
  }
};

export const onStateless = async ({ payload, document }: any) => {
  // broadcast the client event (derived from the server event) to all the clients so that they can update their state
  const response = DocumentCollaborativeEvents[payload as TDocumentEventsServer].client;
  if (response) {
    document.broadcastStateless(response);
  }
};
