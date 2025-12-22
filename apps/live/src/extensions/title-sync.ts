// hocuspocus
import type { Extension, Hocuspocus, Document } from "@hocuspocus/server";
import { TiptapTransformer } from "@hocuspocus/transformer";
import type { AnyExtension, JSONContent } from "@tiptap/core";
import type * as Y from "yjs";
// editor extensions
import {
  TITLE_EDITOR_EXTENSIONS,
  createRealtimeEvent,
  extractTextFromHTML,
  generateTitleProsemirrorJson,
} from "@plane/editor";
import { logger } from "@plane/logger";
import { AppError } from "@/lib/errors";
// helpers
import { getPageService } from "@/services/page/handler";
import type { HocusPocusServerContext, OnLoadDocumentPayloadWithContext } from "@/types";
import { broadcastMessageToPage } from "@/utils/broadcast-message";
import { TitleUpdateManager } from "./title-update/title-update-manager";

/**
 * Hocuspocus extension for synchronizing document titles
 */
export class TitleSyncExtension implements Extension {
  // Maps document names to their observers and update managers
  private titleObservers: Map<string, (events: Y.YEvent<any>[]) => void> = new Map();
  private titleUpdateManagers: Map<string, TitleUpdateManager> = new Map();
  // Store minimal data needed for each document's title observer (prevents closure memory leaks)
  private titleObserverData: Map<
    string,
    {
      parentId?: string | null;
      userId: string;
      workspaceSlug: string | null;
      instance: Hocuspocus;
    }
  > = new Map();

  /**
   * Handle document loading - migrate old titles if needed
   */
  async onLoadDocument({ context, document, documentName }: OnLoadDocumentPayloadWithContext) {
    try {
      // initially for on demand migration of old titles to a new title field
      // in the yjs binary
      if (document.isEmpty("title")) {
        const service = getPageService(context.documentType, context);
        const pageDetails = await service.fetchDetails(documentName);
        const title = pageDetails.name;
        if (title == null) return;
        const titleJson = (generateTitleProsemirrorJson as (text: string) => JSONContent)(title);
        const titleField = TiptapTransformer.toYdoc(titleJson, "title", TITLE_EDITOR_EXTENSIONS as AnyExtension[]);
        document.merge(titleField);
      }
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "onLoadDocument", documentName },
      });
      logger.error("Error loading document title", appError);
    }
  }
  /**
   * Set up title synchronization for a document after it's loaded
   */
  async afterLoadDocument({
    document,
    documentName,
    context,
    instance,
  }: {
    document: Document;
    documentName: string;
    context: HocusPocusServerContext;
    instance: Hocuspocus;
  }) {
    // Create a title update manager for this document
    const updateManager = new TitleUpdateManager(documentName, context);

    // Store the manager
    this.titleUpdateManagers.set(documentName, updateManager);

    // Store minimal data needed for the observer (prevents closure memory leak)
    this.titleObserverData.set(documentName, {
      userId: context.userId,
      workspaceSlug: context.workspaceSlug,
      instance: instance,
    });

    // Create observer using bound method to avoid closure capturing heavy objects
    const titleObserver = this.handleTitleChange.bind(this, documentName);

    // Observe the title field
    document.getXmlFragment("title").observeDeep(titleObserver);
    this.titleObservers.set(documentName, titleObserver);
  }

  /**
   * Handle title changes for a document
   * This is a separate method to avoid closure memory leaks
   */
  private handleTitleChange(documentName: string, events: Y.YEvent<any>[]) {
    let title = "";
    events.forEach((event) => {
      title = extractTextFromHTML(event.currentTarget.toJSON() as string);
    });

    // Get the manager for this document
    const manager = this.titleUpdateManagers.get(documentName);

    // Get the stored data for this document
    const data = this.titleObserverData.get(documentName);

    // Broadcast to parent page if it exists
    if (data?.parentId && data.workspaceSlug && data.instance) {
      const event = createRealtimeEvent({
        user_id: data.userId,
        workspace_slug: data.workspaceSlug,
        action: "property_updated",
        page_id: documentName,
        data: { name: title },
        descendants_ids: [],
      });

      // Use the instance from stored data (guaranteed to be set)
      broadcastMessageToPage(data.instance, data.parentId, event);
    }

    // Schedule the title update
    if (manager) {
      manager.scheduleUpdate(title);
    }
  }

  /**
   * Force save title before unloading the document
   */
  async beforeUnloadDocument({ documentName }: { documentName: string }) {
    const updateManager = this.titleUpdateManagers.get(documentName);
    if (updateManager) {
      // Force immediate save and wait for it to complete
      await updateManager.forceSave();
      // Clean up the manager
      this.titleUpdateManagers.delete(documentName);
    }
  }

  /**
   * Remove observers after document unload
   */
  async afterUnloadDocument({ documentName, document }: { documentName: string; document?: Document }) {
    // Clean up observer when document is unloaded
    const observer = this.titleObservers.get(documentName);
    if (observer) {
      // unregister observer from Y.js document to prevent memory leak
      if (document) {
        try {
          document.getXmlFragment("title").unobserveDeep(observer);
        } catch (error) {
          logger.error("Failed to unobserve title field", new AppError(error, { context: { documentName } }));
        }
      }
      this.titleObservers.delete(documentName);
    }

    // Clean up the observer data map to prevent memory leak
    this.titleObserverData.delete(documentName);

    // Ensure manager is cleaned up if beforeUnloadDocument somehow didn't run
    if (this.titleUpdateManagers.has(documentName)) {
      const manager = this.titleUpdateManagers.get(documentName)!;
      manager.cancel();
      this.titleUpdateManagers.delete(documentName);
    }
  }
}
