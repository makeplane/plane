import { projectPageHandler } from "./project-page-handler";
import type { Hocuspocus } from "@hocuspocus/server";

export function initializeDocumentHandlers(hocuspocusServer: Hocuspocus) {
  projectPageHandler.register();
}
