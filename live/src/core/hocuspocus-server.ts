import { Server } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
import { IncomingHttpHeaders } from "http";
// lib
import { handleAuthentication } from "@/core/lib/authentication";
// extensions
import { getExtensions } from "@/core/extensions/index";
import { DocumentCollaborativeEvents, TDocumentEventsServer } from "@plane/editor/lib";
// editor types
import { TUserDetails } from "@plane/editor";
// types
import { TDocumentTypes, type HocusPocusServerContext } from "@/core/types/common";
// error handling
import { catchAsync } from "@/core/helpers/error-handling/error-handler";
import { handleError } from "@/core/helpers/error-handling/error-factory";

export const getHocusPocusServer = async () => {
  const extensions = await getExtensions();
  const serverName = process.env.HOSTNAME || uuidv4();
  return Server.configure({
    name: serverName,
    onAuthenticate: async ({
      requestHeaders,
      context,
      requestParameters,
      // user id used as token for authentication
      token,
    }: {
      requestHeaders: IncomingHttpHeaders;
      context: HocusPocusServerContext; // Better than 'any', still allows property assignment
      requestParameters: URLSearchParams;
      token: string;
    }) => {
      // need to rethrow all errors since hocuspocus needs to know to stop
      // further propagation of events to other document lifecycle
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
            handleError(null, {
              errorType: "unauthorized",
              message: "Credentials not provided",
              component: "hocuspocus",
              operation: "authenticate",
              extraContext: { tokenProvided: !!token },
              throw: true,
            });
          }

          context.documentType = requestParameters.get("documentType")?.toString() as TDocumentTypes;
          context.cookie = cookie ?? requestParameters.get("cookie");
          context.userId = userId;
          context.workspaceSlug = requestParameters.get("workspaceSlug")?.toString() as string;

          return await handleAuthentication({
            cookie: context.cookie,
            userId: context.userId,
            workspaceSlug: context.workspaceSlug,
          });
        },
        { extra: { operation: "authenticate" } },
        {
          rethrow: true,
        }
      )();
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
    debounce: 1000,
  });
};
