import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Logger } from "@hocuspocus/extension-logger";
import express from "express";
import expressWs, { Application } from "express-ws";
// page actions
import { fetchPageDescriptionBinary, updateDocument } from "./page.js";
// services
import { UserService } from "./services/user.service.js";
const userService = new UserService();

const server = Server.configure({
  onAuthenticate: async ({
    requestHeaders,
    requestParameters,
    connection,
    token,
  }) => {
    // request headers
    const cookie = requestHeaders.cookie?.toString();
    // params
    const params = requestParameters;
    const workspaceSlug = params.get("workspaceSlug")?.toString();
    const projectId = params.get("projectId")?.toString();

    if (!workspaceSlug || !projectId || !cookie)
      throw Error("Credentials not provided");

    try {
      // fetch current user info
      const response = await userService.currentUser(cookie);
      if (response.id !== token) throw Error();
      // fetch current user's roles
      const workspaceRoles = await userService.getUserAllProjectsRole(
        workspaceSlug,
        cookie,
      );
      const currentProjectRole = workspaceRoles[projectId];
      // make the connection read only for roles lower than a member
      if (currentProjectRole < 15) {
        connection.readOnly = true;
      }

      return {
        user: {
          id: response.id,
          name: response.display_name,
        },
      };
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
        const workspaceSlug = params.get("workspaceSlug")?.toString();
        const projectId = params.get("projectId")?.toString();

        return new Promise(async (resolve) => {
          const fetchedData = await fetchPageDescriptionBinary(
            workspaceSlug,
            projectId,
            pageId,
            cookie,
          );
          resolve(fetchedData);
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
        const workspaceSlug = params.get("workspaceSlug")?.toString();
        const projectId = params.get("projectId")?.toString();

        return new Promise(async () => {
          await updateDocument(workspaceSlug, projectId, pageId, state, cookie);
        });
      },
    }),
  ],
});
const { app }: { app: Application } = expressWs(express());

app.ws("/collaboration", (websocket, request) => {
  server.handleConnection(websocket, request);
});

app.listen(3004);
