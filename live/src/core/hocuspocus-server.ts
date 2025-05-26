import { Server } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
import { IncomingHttpHeaders } from "http";
// lib
import { handleAuthentication } from "@/core/lib/authentication";
// extensions
import { getExtensions } from "@/core/extensions/index";
import { DocumentCollaborativeEvents, TDocumentEventsServer } from "@plane/editor/lib";
// editor types
import { EventToPayloadMap, TUserDetails, createRealtimeEvent } from "@plane/editor";
// types
import { TDocumentTypes, type HocusPocusServerContext } from "@/core/types/common";
// error handling
import { catchAsync } from "@/core/helpers/error-handling/error-handler";
import { handleError } from "@/core/helpers/error-handling/error-factory";
// server agent
import { serverAgentManager } from "@/ee/agents/server-agent";

export const getHocusPocusServer = async () => {
  const extensions = await getExtensions();
  const serverName = process.env.HOSTNAME || uuidv4();
  const server = Server.configure({
    name: serverName,
    onAuthenticate: async ({
      requestHeaders,
      requestParameters,
      context,
      token,
    }: {
      requestHeaders: IncomingHttpHeaders;
      context: HocusPocusServerContext;
      requestParameters: URLSearchParams;
      token: string;
    }) => {
      return catchAsync(
        async () => {
          let cookie: string | undefined = undefined;
          let userId: string | undefined = undefined;

          // Extract cookie (fallback to request headers) and userId from token
          try {
            const parsedToken = JSON.parse(token) as TUserDetails;
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

          context.documentType = requestParameters.get("documentType")?.toString() as TDocumentTypes;
          context.cookie = cookie ?? requestParameters.get("cookie") ?? "";
          context.userId = userId;
          context.workspaceSlug = requestParameters.get("workspaceSlug")?.toString() ?? "";
          context.parentId = requestParameters.get("parentPageId")?.toString() ?? undefined;
          context.projectId = requestParameters.get("projectId")?.toString() ?? "";
          context.teamspaceId = requestParameters.get("teamspaceId")?.toString() ?? "";

          return await handleAuthentication({
            cookie: context.cookie,
            userId: context.userId,
            workspaceSlug: context.workspaceSlug,
          });
        },
        { extra: { operation: "authenticate" } },
        { rethrow: true }
      )();
    },
    onStateless: async ({ payload, document, connection }) => {
      return catchAsync(
        async () => {
          const payloadStr = payload as string;

          // Function to safely parse JSON without throwing exceptions
          const safeJsonParse = (str: string) => {
            try {
              return { success: true, data: JSON.parse(str) };
            } catch (e) {
              return { success: false, error: e };
            }
          };

          // First check if this is a known document event
          const documentEvent = DocumentCollaborativeEvents[payload as TDocumentEventsServer]?.client;

          if (documentEvent) {
            const eventType = documentEvent as keyof EventToPayloadMap;

            let eventData: Partial<EventToPayloadMap[typeof eventType]> = {
              user_id: connection.context.userId,
            };

            if (eventType === "archived") {
              eventData = {
                ...eventData,
                archived_at: new Date().toISOString(),
              };
            }

            const realtimeEvent = createRealtimeEvent({
              action: eventType,
              page_id: document.name,
              descendants_ids: [],
              data: eventData as EventToPayloadMap[typeof eventType],
              workspace_slug: connection.context.workspaceSlug || "",
              user_id: connection.context.userId || "",
            });

            // Broadcast the event
            document.broadcastStateless(JSON.stringify(realtimeEvent));
            return;
          }

          // If not a document event, try to parse as JSON
          const parseResult = safeJsonParse(payloadStr);

          if (parseResult.success && parseResult.data && typeof parseResult.data === "object") {
            const parsedPayload = parseResult.data as {
              workspaceSlug?: string;
              projectId?: string;
              action?: string;
            };

            // Handle synced action
            if (parsedPayload.action === "synced" && parsedPayload.workspaceSlug) {
              serverAgentManager.notifySyncTrigger(document.name, connection.context);
              return;
            }
          }
        },
        { extra: { operation: "stateless", payload } }
      )();
    },
    extensions: [...extensions],
    debounce: 10000,
  });
  return server;
};
