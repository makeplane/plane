import {
  DocumentHandler,
  DocumentFetchParams,
  DocumentStoreParams,
  HandlerDefinition,
} from "@/core/types/document-handler";
import { handlerFactory } from "@/core/handlers/document-handlers/handler-factory";
import {
  fetchPageDescriptionBinary,
  updatePageDescription,
  fetchProjectPageTitle,
  updateProjectPageTitle,
} from "./handlers";

/**
 * Handler for "project_page" document type
 */
export const projectPageHandler: DocumentHandler = {
  /**
   * Fetch project page description
   */
  fetch: fetchPageDescriptionBinary,
  /**
   * Store project page description
   */
  store: updatePageDescription,
  /**
   * Fetch project page title
   */
  fetchTitle: fetchProjectPageTitle,
  /**
   * Store project page title
   */
  updateTitle: updateProjectPageTitle,
};

// Define the project page handler definition
export const projectPageHandlerDefinition: HandlerDefinition = {
  selector: (context) => context.documentType === "project_page",
  handler: projectPageHandler,
  priority: 10, // Standard priority
};

// Register the handler directly from CE
export function registerProjectPageHandler() {
  handlerFactory.register(projectPageHandlerDefinition);
}
