import {
  fetchPageDescriptionBinary,
  fetchProjectPageTitle,
  updatePageDescription,
  updateProjectPageTitle,
} from "@/core/lib/page";
import { HocusPocusServerContext } from "@/core/types/common";
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
  store: async ({ pageId, state, params, context, title }: DocumentStoreParams) => {
    const { cookie } = context;
    await updatePageDescription(params, pageId, state, cookie, title);
  },

  /**
   * Fetch project page title
   */
  fetchTitle: async ({
    workspaceSlug,
    projectId,
    pageId,
    cookie,
  }: {
    workspaceSlug: string;
    projectId: string;
    pageId: string;
    cookie: string;
  }) => {
    return await fetchProjectPageTitle(workspaceSlug, projectId, pageId, cookie);
  },

  /**
   * Update project page title
   */
  updateTitle: async (
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    title: string,
    cookie: string,
    abortSignal?: AbortSignal
  ) => {
    await updateProjectPageTitle(workspaceSlug, projectId, pageId, title, cookie, abortSignal);
  },
};

// Define the project page handler definition
export const projectPageHandlerDefinition: HandlerDefinition = {
  selector: (context: HocusPocusServerContext) => context.documentType === "project_page" && !context.agentId,
  handler: projectPageHandler,
  priority: 10, // Standard priority
};
