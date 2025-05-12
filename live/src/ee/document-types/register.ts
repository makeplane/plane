import { projectPageHandler } from "@/ce/document-types/project-page-handler";
import { serverAgentHandler } from "./server-agent-handlers";
import { teamspacePageHandler } from "./teamspace-page-handler";
import { workspacePageHandler } from "./workspace-page-handler";
import { serverAgentManager } from "../agents/server-agent";
import type { Hocuspocus } from "@hocuspocus/server";

export function initializeDocumentHandlers(hocusPocusServer: Hocuspocus) {
  projectPageHandler.register();
  workspacePageHandler.register();
  teamspacePageHandler.register();

  // Initialize the server agent manager with the Hocuspocus server
  serverAgentManager.initialize(hocusPocusServer).setupHocusPocusHooks();
  serverAgentHandler.register();
}
