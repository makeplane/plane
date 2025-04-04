import { DocumentCollaborativeEvents, TDocumentEventsServer } from "@plane/editor/lib";

import { Logger } from "@hocuspocus/extension-logger";
import { Database } from "@hocuspocus/extension-database";
import { Redis } from "@hocuspocus/extension-redis";
import { Hocuspocus } from "@hocuspocus/server";

import { v4 as uuidv4 } from "uuid";
import { getRedisClient } from "./redis";
import { UserService } from "./services/user.service";

// import { handleError } from "@/core/helpers/error-handling/error-factory";
// import { TDocumentTypes } from "@/core/types/common";
// import { handleAuthentication } from "@/core/lib/authentication";
// import { IncomingHttpHeaders } from "http";

export const createHocusPocus = () => {
  const serverName = process.env.HOSTNAME || uuidv4();
  return new Hocuspocus({
    name: serverName,
    onAuthenticate: onAuthenticate(),
    onStateless: onStateless(),
    extensions: [
      new Logger(),
      new Database({
        fetch: handleDataFetch,
        store: handleDataStore,
      }),
      new Redis({ redis: getRedisClient() }),
    ],
    debounce: 1000,
  });
};

const validateToken = async (token: string | undefined) => {
  try {
    if (!token) {
      throw new Error("Token not provided");
    }
    const userService = new UserService();
    const response = await userService.currentUser(token);
    return response;
  } catch (error) {
    return null;
  }
};

const onAuthenticate = () => {
  return async ({ token }: { token: string | undefined }) => {
    const user = await validateToken(token);
    if (!user) {
      throw new Error("Invalid token");
    }
    return user;
  };
};

const onStateless = () => {
  return async ({ payload, document }: any) => {
    // broadcast the client event (derived from the server event) to all the clients so that they can update their state
    const response = DocumentCollaborativeEvents[payload as TDocumentEventsServer].client;
    if (response) {
      document.broadcastStateless(response);
    }
  };
};

const handleDataFetch = async (data: any) => {
  try {
    const { context, documentName, requestParameters } = data;
    console.log("handleDataFetch", context);
    console.log("handleDataFetch", documentName);
    console.log("handleDataFetch", requestParameters);
    return documentName; // TODO: remove this once the API integration is done
    // fetch the data using page service
    // const pageService = new PageService();
    // const page = await pageService.getPage(documentName);
    // return page;
  } catch (error) {
    console.error("handleDataFetch", error);
    throw error;
  }
};

const handleDataStore = async (data: any) => {
  try {
    const { context, documentName, requestParameters } = data;
    console.log("handleDataStore", context);
    console.log("handleDataStore", documentName);
    console.log("handleDataStore", requestParameters);
    return documentName; // TODO: remove this once the API integration is done
    // store the data using page service
    // const pageService = new PageService();
    // const page = await pageService.updatePage(documentName, requestParameters);
    // return page;
  } catch (error) {
    console.error("handleDataStore", error);
    throw error;
  }
};

// async ({
//   token,
//   requestParameters,
//   requestHeaders,
// }: {
//   token: string;
//   requestParameters: URLSearchParams;
//   requestHeaders: IncomingHttpHeaders;
// }) => {
//   let cookie: string | undefined = undefined;
//   let userId: string | undefined = undefined;

//   try {
//     const parsedToken = JSON.parse(token) as { id: string; cookie: string };
//     userId = parsedToken.id;
//     cookie = parsedToken.cookie;
//   } catch (error) {
//     console.error("Token parsing failed, using request headers:", error);
//   } finally {
//     if (!cookie) {
//       cookie = requestHeaders.cookie?.toString();
//     }
//   }

//   if (!cookie || !userId) {
//     handleError(null, {
//       errorType: "unauthorized",
//       message: "Credentials not provided",
//       component: "hocuspocus",
//       operation: "authenticate",
//       extraContext: { tokenProvided: !!token },
//       throw: true,
//     });
//   }

//   const documentType = requestParameters.get("documentType")?.toString() as TDocumentTypes;
//   const workspaceSlug = requestParameters.get("workspaceSlug")?.toString() as string;

//   return await handleAuthentication({
//     cookie,
//     userId,
//     workspaceSlug,
//   });
// }
