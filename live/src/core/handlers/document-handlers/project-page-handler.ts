import { fetchPageDescriptionBinary, updatePageDescription } from "@/core/document-types/project-page";
import {
  DocumentHandler,
  DocumentFetchParams,
  DocumentStoreParams,
  HandlerDefinition,
} from "@/core/types/document-handler";

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
  store: async ({ pageId, state, params, context }: DocumentStoreParams) => {
    const { cookie } = context;
    await updatePageDescription(params, pageId, state, cookie);
  },
};

// Define the project page handler definition
export const projectPageHandlerDefinition: HandlerDefinition = {
  selector: (context) => context.documentType === "project_page",
  handler: projectPageHandler,
  priority: 10, // Standard priority
};
