import { HocusPocusServerContext } from "@/core/types/common";
import { DocumentHandler, HandlerDefinition } from "@/core/types/document-handler";

/**
 * Class that manages handler selection based on multiple criteria
 */
export class DocumentHandlerFactory {
  private handlers: HandlerDefinition[] = [];

  /**
   * Register a handler with its selection criteria
   */
  register(definition: HandlerDefinition): void {
    this.handlers.push(definition);
    // Sort handlers by priority (highest first)
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get the appropriate handler based on the provided context
   */
  getHandler(context: Partial<HocusPocusServerContext>): DocumentHandler {
    // Find the first handler whose selector returns true
    const matchingHandler = this.handlers.find((h) => h.selector(context));
    // console.log("matchingHandler:", matchingHandler);

    // Return the matching handler or fall back to null/undefined
    // (This will cause an error if no handlers match, which is good for debugging)
    return matchingHandler?.handler as DocumentHandler;
  }
}

// Create the singleton instance
export const handlerFactory = new DocumentHandlerFactory();
