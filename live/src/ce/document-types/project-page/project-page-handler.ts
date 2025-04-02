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
  fetch: async ({ pageId, params, context }: DocumentFetchParams) => {
    const { cookie } = context;
    return await fetchPageDescriptionBinary(params, pageId, cookie);
  },

  /**
   * Store project page description
   */
  store: async ({ pageId, state, params, context, title }: DocumentStoreParams) => {
    const { cookie } = context;
    await updatePageDescription({ params, pageId, updatedDescription: state, cookie, title });
  },

  /**
   * Fetch project page title
   */
  fetchTitle: async ({ workspaceSlug, projectId, pageId, cookie }) => {
    return await fetchProjectPageTitle({ workspaceSlug, projectId, pageId, cookie });
  },

  /**
   * Store project page title
   */
  updateTitle: async ({ workspaceSlug, projectId, pageId, title, cookie, abortSignal }) => {
    await updateProjectPageTitle({ workspaceSlug, projectId, pageId, title, cookie, abortSignal });
  },
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
