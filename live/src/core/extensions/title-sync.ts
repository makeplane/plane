import { Extension, afterLoadDocumentPayload, Hocuspocus } from "@hocuspocus/server";
import * as Y from "yjs";
import { getDocumentHandler } from "../handlers/document-handlers";

// Enhanced debounce function with cleanup and edge case handling
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
        lastArgs = null;
      }
      timeout = null;
    }, wait);
  };

  // Add cancel method to clear any pending timeouts
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
  };

  return debounced;
};

export class TitleSyncExtension implements Extension {
  instance!: Hocuspocus;
  titleObservers: Map<string, (events: Y.YEvent<any>[]) => void> = new Map();
  debouncedUpdateTitle: Map<string, ReturnType<typeof debounce>> = new Map();

  async afterLoadDocument({ document, documentName, context, requestParameters }: afterLoadDocumentPayload) {
    const workspaceSlug = requestParameters.get("workspaceSlug")?.toString();
    const projectId = requestParameters.get("projectId")?.toString();
    const documentHandler = getDocumentHandler(context.documentType);

    if (!workspaceSlug || !projectId) return;

    // Create debounced update function for this document
    const updateTitle = debounce(async (title: string) => {
      if (documentHandler.updateTitle) {
        try {
          await documentHandler.updateTitle(
            workspaceSlug,
            projectId,
            documentName,
            title,
            context.cookie
          );
        } catch (error) {
          console.error("Error updating title:", error);
        }
      }
    }, 3000); // 3 second debounce

    // Store the debounced function
    this.debouncedUpdateTitle.set(documentName, updateTitle);

    // Set up observer for title field
    const titleObserver = (events: Y.YEvent<any>[]) => {
      let title = "";
      events.forEach((event) => {
        title = extractTextFromHTML(event.currentTarget.toJSON());
      });
      
      // Get the debounced function for this document and call it
      const debouncedUpdate = this.debouncedUpdateTitle.get(documentName);
      if (debouncedUpdate) {
        debouncedUpdate(title);
      }
    };

    // Observe the title field
    document.getXmlFragment("title").observeDeep(titleObserver);
    this.titleObservers.set(documentName, titleObserver);
  }

  async afterUnloadDocument({ documentName }: { documentName: string }) {
    // Clean up observer and debounced function when document is unloaded
    const observer = this.titleObservers.get(documentName);
    if (observer) {
      this.titleObservers.delete(documentName);
    }
    
    const debouncedUpdate = this.debouncedUpdateTitle.get(documentName);
    if (debouncedUpdate) {
      // Cancel any pending debounced calls before removing
      debouncedUpdate.cancel();
      this.debouncedUpdateTitle.delete(documentName);
    }
  }
}

export const extractTextFromHTML = (html: string): string => {
  // Use a regex to extract text between tags
  const textMatch = html.replace(/<[^>]*>/g, "");
  return textMatch || "";
};

