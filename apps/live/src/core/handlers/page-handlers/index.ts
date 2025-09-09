import { handlerFactory } from "@/core/handlers/page-handlers/handler-factory";

import { HocusPocusServerContext, TDocumentTypes } from "@/core/types/common";
import { DocumentHandler } from "@/core/types/document-handler";
/**
 * Get a document handler based on the provided context criteria
 * @param documentType The primary document type
 * @param additionalContext Optional additional context criteria
 * @returns The appropriate document handler
 */
export function getDocumentHandler(
  documentType: TDocumentTypes,
  additionalContext?: Omit<HocusPocusServerContext, "documentType">
): DocumentHandler {
  // Create a context object with all criteria
  const context: Partial<HocusPocusServerContext> = {
    documentType: documentType,
    ...additionalContext,
  };

  // Use the factory to get the appropriate handler
  return handlerFactory.getHandler(context);
}

// Export the factory for direct access if needed
export { handlerFactory };
