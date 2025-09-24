// hocuspocus
import { Extension, Hocuspocus, Document } from "@hocuspocus/server";
import { TiptapTransformer } from "@hocuspocus/transformer";
import * as Y from "yjs";
// types
// editor extensions
import { TITLE_EDITOR_EXTENSIONS, createRealtimeEvent } from "@plane/editor";
// handlers
import { getDocumentHandler } from "@/core/handlers/page-handlers";
// helpers
import { generateTitleProsemirrorJson } from "@/core/helpers/generate-title-prosemirror-json";
import { HocusPocusServerContext } from "@/core/types/common";
import { broadcastMessageToPage } from "@/ee/lib/utils/broadcast-message";
import { TitleUpdateManager } from "./title-update/title-update-manager";
import { extractTextFromHTML } from "./title-update/title-utils";

/**
 * Hocuspocus extension for synchronizing document titles
 */
export class TitleSyncExtension implements Extension {
  instance!: Hocuspocus;

  // Maps document names to their observers and update managers
  private titleObservers: Map<string, (events: Y.YEvent<any>[]) => void> = new Map();
  private titleUpdateManagers: Map<string, TitleUpdateManager> = new Map();

  /**
   * Handle document loading - migrate old titles if needed
   */
  async onLoadDocument({ context, document }: { context: HocusPocusServerContext; document: Document }) {
    try {
      // initially for on demand migration of old titles to a new title field
      // in the yjs binary
      if (document.isEmpty("title")) {
        const documentHandler = getDocumentHandler(context.documentType);
        const title = await documentHandler.fetchTitle?.({
          context,
          pageId: document.name,
        });
        if (title == null) return;
        const titleField = TiptapTransformer.toYdoc(
          generateTitleProsemirrorJson(title),
          "title",
          // editor
          TITLE_EDITOR_EXTENSIONS
        );
        document.merge(titleField);
      }
    } catch (error) {
      console.error("Error in onLoadDocument: ", error);
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
    const documentHandler = getDocumentHandler(context.documentType);

    // Create a title update manager for this document
    const updateManager = new TitleUpdateManager(documentName, context, documentHandler);

    // Store the manager
    this.titleUpdateManagers.set(documentName, updateManager);

    // Set up observer for title field
    const titleObserver = (events: Y.YEvent<any>[]) => {
      let title = "";
      events.forEach((event) => {
        title = extractTextFromHTML(event.currentTarget.toJSON());
      });

      // Schedule an update with the manager
      const manager = this.titleUpdateManagers.get(documentName);

      // In your titleObserver
      if (context.parentId) {
        const event = createRealtimeEvent({
          user_id: context.userId,
          workspace_slug: context.workspaceSlug as string,
          action: "property_updated",
          page_id: documentName,
          data: { name: title },
          descendants_ids: [],
        });

        broadcastMessageToPage(instance, context.parentId, event);
      }

      if (manager) {
        manager.scheduleUpdate(title);
      }
    };

    // Observe the title field
    document.getXmlFragment("title").observeDeep(titleObserver);
    this.titleObservers.set(documentName, titleObserver);
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
  async afterUnloadDocument({ documentName }: { documentName: string }) {
    // Clean up observer when document is unloaded
    const observer = this.titleObservers.get(documentName);
    if (observer) {
      this.titleObservers.delete(documentName);
    }

    // Ensure manager is cleaned up if beforeUnloadDocument somehow didn't run
    if (this.titleUpdateManagers.has(documentName)) {
      const manager = this.titleUpdateManagers.get(documentName)!;
      manager.cancel();
      this.titleUpdateManagers.delete(documentName);
    }
  }
}
