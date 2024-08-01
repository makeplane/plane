import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import express from "express";
import expressWs, { Application } from "express-ws";
// page actions
import {
  fetchPageDescriptionBinary,
  updatePageDescription,
} from "./lib/page.js";
// types
import { TDocumentTypes } from "./types/common.js";
// helpers
import { handleAuthentication } from "./lib/authentication.js";

const server = Server.configure({
  onAuthenticate: async ({
    requestHeaders,
    requestParameters,
    connection,
    // user id used as token for authentication
    token,
  }) => {
    // request headers
    const cookie = requestHeaders.cookie?.toString();
    // params
    const params = requestParameters;

    if (!cookie) {
      throw Error("Credentials not provided");
    }

    try {
      await handleAuthentication({
        connection,
        cookie,
        params,
        token,
      });
    } catch (error) {
      throw Error("Authentication unsuccessful!");
    }
  },
  extensions: [
    new Logger(),
    new Database({
      fetch: async ({
        documentName: pageId,
        requestHeaders,
        requestParameters,
      }) => {
        // request headers
        const cookie = requestHeaders.cookie?.toString();
        // query params
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as
          | TDocumentTypes
          | undefined;

        return new Promise(async (resolve) => {
          if (documentType === "project_page") {
            const fetchedData = await fetchPageDescriptionBinary(
              params,
              pageId,
              cookie
            );
            resolve(fetchedData);
          }
        });
      },
      store: async ({
        state,
        documentName: pageId,
        requestHeaders,
        requestParameters,
      }) => {
        // request headers
        const cookie = requestHeaders.cookie?.toString();
        // query params
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as
          | TDocumentTypes
          | undefined;

        return new Promise(async () => {
          if (documentType === "project_page") {
            await updatePageDescription(params, pageId, state, cookie);
          }
        });
      },
    }),
  ],
});
const { app }: { app: Application } = expressWs(express());

app.set("port", process.env.PORT || 3000);

app.get("/health", (_request, response) => {
  response.status(200);
});

app.ws("/collaboration", (websocket, request) => {
  server.handleConnection(websocket, request);
});

app.listen(3000, () => {
  console.log("Live server has started");
});
