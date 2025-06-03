import { projectPageHandler } from "@/ce/document-types/project-page-handler";
import { teamspacePageHandler } from "./teamspace-page-handler";
import { workspacePageHandler } from "./workspace-page-handler";

export function initializeDocumentHandlers() {
  projectPageHandler.register();
  workspacePageHandler.register();
  teamspacePageHandler.register();
}
