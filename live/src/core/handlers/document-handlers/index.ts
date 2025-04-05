import { DocumentHandler } from "@/core/types/document-handler";
import { handlerFactory } from "@/core/handlers/document-handlers/handler-factory";

import { HocusPocusServerContext } from "@/core/types/common";
import { initializeDocumentHandlers } from "@/plane-live/document-types";

// initialize all document handlers
initializeDocumentHandlers();

/**
 * Get a document handler based on the provided context criteria
 * @param documentType The primary document type
 * @param additionalContext Optional additional context criteria
 * @returns The appropriate document handler
 */
export function getDocumentHandler(context: HocusPocusServerContext): DocumentHandler {
  return handlerFactory.getHandler(context);
}

// Export the factory for direct access if needed
export { handlerFactory };
