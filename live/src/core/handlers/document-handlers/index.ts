import { DocumentHandler } from "@/core/types/document-handler";
import { handlerFactory } from "@/core/handlers/document-handlers/handler-factory";

import { HocusPocusServerContext } from "@/core/types/common";
import { initializeDocumentHandlers } from "@/plane-live/document-types";

// Initialize all CE document handlers
initializeDocumentHandlers();

/**
 * Get a document handler based on the provided context criteria
 * @param documentType The primary document type
 * @param additionalContext Optional additional context criteria
 * @returns The appropriate document handler
 */
export function getDocumentHandler(
  documentType: string,
  additionalContext: Omit<HocusPocusServerContext, "documentType">
): DocumentHandler {
  // Create a context object with all criteria
  const context: HocusPocusServerContext = {
    documentType: documentType as any,
    ...additionalContext,
  };

  // Use the factory to get the appropriate handler
  return handlerFactory.getHandler(context);
}

// Export the factory for direct access if needed
export { handlerFactory };
