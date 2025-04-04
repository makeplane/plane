import {
  DocumentHandler,
  DocumentFetchParams,
  DocumentStoreParams,
  HandlerDefinition,
} from "@/core/types/document-handler";
import { handlerFactory } from "@/core/handlers/document-handlers/handler-factory";
import { PageService } from "@/services/page.service";
import { transformHTMLToBinary } from "./transformers";
import { getAllDocumentFormatsFromBinaryData } from "@/core/helpers/page";

const pageService = new PageService();

/**
 * Handler for "project_page" document type
 */
export const projectPageHandler: DocumentHandler = {
  /**
   * Fetch project page description
   */
  fetch: async ({ pageId, params, context }: DocumentFetchParams) => {
    const { cookie } = context;
    const workspaceSlug = params.get("workspaceSlug")?.toString();
    const projectId = params.get("projectId")?.toString();
    if (!workspaceSlug || !projectId || !cookie) return null;

    const response = await pageService.fetchDescriptionBinary(workspaceSlug, projectId, pageId, cookie);
    const binaryData = new Uint8Array(response);

    if (binaryData.byteLength === 0) {
      const binary = await transformHTMLToBinary(workspaceSlug, projectId, pageId, cookie);
      if (binary) {
        return binary;
      }
    }

    return binaryData;
  },

  /**
   * Store project page description
   */
  store: async ({ pageId, state, params, context }: DocumentStoreParams) => {
    const { cookie } = context;
    if (!(state instanceof Uint8Array)) {
      throw new Error("Invalid state: must be an instance of Uint8Array");
    }

    const workspaceSlug = params?.get("workspaceSlug")?.toString();
    const projectId = params?.get("projectId")?.toString();
    if (!workspaceSlug || !projectId || !cookie) return;

    const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromBinaryData(state);
    const payload = {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
    };

    await pageService.updateDescription(workspaceSlug, projectId, pageId, payload, cookie);
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
