import { DocumentCollaborativeEvents, TDocumentEventsServer } from "@plane/editor/lib";
import { Hocuspocus, onStatelessPayload } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
import { handleError } from "@/core/helpers/error-handling/error-factory";
import { TDocumentTypes } from "@/core/types/common";
import { handleAuthentication } from "@/core/lib/authentication";
import { IncomingHttpHeaders } from "http";

export const createHocusPocus = () => {
  const serverName = process.env.HOSTNAME || uuidv4();

  return new Hocuspocus({
    name: serverName,
    onAuthenticate: async ({
      token,
      requestParameters,
      requestHeaders,
    }: {
      token: string;
      requestParameters: URLSearchParams;
      requestHeaders: IncomingHttpHeaders;
    }) => {
      let cookie: string | undefined = undefined;
      let userId: string | undefined = undefined;

      try {
        const parsedToken = JSON.parse(token) as { id: string; cookie: string };
        userId = parsedToken.id;
        cookie = parsedToken.cookie;
      } catch (error) {
        console.error("Token parsing failed, using request headers:", error);
      } finally {
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

      const documentType = requestParameters.get("documentType")?.toString() as TDocumentTypes;
      const workspaceSlug = requestParameters.get("workspaceSlug")?.toString() as string;

      return await handleAuthentication({
        cookie,
        userId,
        workspaceSlug,
      });
    },
    onStateless: async (payload: onStatelessPayload) => {
      const response = DocumentCollaborativeEvents[payload.payload as TDocumentEventsServer].client;
      if (response) {
        payload.document.broadcastStateless(response);
      }
    },
    debounce: 1000,
  });
};
