import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import express from "express";
import expressWs, { Application } from "express-ws";
// types
import { TContext } from "./types/server.js";
// page actions
import { fetchPageDescriptionBinary, updateDocument } from "./page.js";

const server = Server.configure({
  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName, context }) =>
        new Promise(async (resolve) => {
          const fetchedData = await fetchPageDescriptionBinary(
            documentName,
            context,
          );
          resolve(fetchedData);
        }),
      store: async ({ state, documentName, context }) =>
        new Promise(async () => {
          await updateDocument(documentName, state, context);
        }),
    }),
  ],
});
const { app }: { app: Application } = expressWs(express());

app.ws("/collaboration", (websocket, request) => {
  const workspaceSlug = request.query.workspaceSlug?.toString();
  const projectId = request.query.projectId?.toString();

  const context: TContext = {
    workspaceSlug,
    projectId,
    cookie: request.headers.cookie,
  };

  server.handleConnection(websocket, request, context);
});

app.listen(1234);
