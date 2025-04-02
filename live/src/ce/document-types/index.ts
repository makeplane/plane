import { registerProjectPageHandler } from "./project-page/project-page-handler";

/**
 * Initialize and register all CE document handlers
 */ 
export function initializeCEDocumentHandlers() {
  registerProjectPageHandler();
}

export * as pages from "./project-page";