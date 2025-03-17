import { Server } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
// lib
import { handleAuthentication } from "@/core/lib/authentication";
// extensions
import { getExtensions } from "@/core/extensions/index";
import { DocumentCollaborativeEvents, TDocumentEventsServer } from "@plane/editor/lib";
// editor types
import { TUserDetails } from "@plane/editor";
// types
import { type HocusPocusServerContext } from "@/core/types/common";
import { catchAsync } from "@/core/helpers/error-reporting";
import { AppError } from "@/core/helpers/error-handler";

export const getHocusPocusServer = async () => {
  const extensions = await getExtensions();
  const serverName = process.env.HOSTNAME || uuidv4();
  return Server.configure({
    name: serverName,
    onAuthenticate: async ({
      requestHeaders,
      context,
      // user id used as token for authentication
      token,
    }) => {
      return catchAsync(
        async () => {
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
            console.error("Token parsing failed, using request headers:", error);
          } finally {
            // If cookie is still not found, fallback to request headers
            if (!cookie) {
              cookie = requestHeaders.cookie?.toString();
            }
          }

          if (!cookie || !userId) {
            throw new AppError("Credentials not provided", 401);
          }

          // set cookie in context, so it can be used throughout the ws connection
          (context as HocusPocusServerContext).cookie = cookie;

          await handleAuthentication({
            cookie,
            userId,
          });
        },
        { extra: { operation: "authenticate" } }
      );
    },
    onStateless: async ({ payload, document }) => {
      return catchAsync(
        async () => {
          // broadcast the client event (derived from the server event) to all the clients so that they can update their state
          const response = DocumentCollaborativeEvents[payload as TDocumentEventsServer].client;
          if (response) {
            document.broadcastStateless(response);
          }
        },
        { extra: { operation: "stateless", payload } }
      );
    },
    extensions,
    debounce: 10000,
  });
};
