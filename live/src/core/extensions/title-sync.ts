// hocuspocus
import { Extension, Hocuspocus, Document } from "@hocuspocus/server";
import { TiptapTransformer } from "@hocuspocus/transformer";
import * as Y from "yjs";
// types
import { HocusPocusServerContext } from "@/core/types/common";
// editor extensions
import { TITLE_EDITOR_EXTENSIONS } from "@plane/editor";
// handlers
import { getDocumentHandler } from "@/core/handlers/document-handlers";
// helpers
import { generateTitleProsemirrorJson } from "@/core/helpers/generate-title-prosemirror-json";
import { extractTextFromHTML } from "./title-update/title-utils";
import { TitleUpdateManager } from "./title-update/title-update-manager";

/**
 * Hocuspocus extension for synchronizing document titles
 */
export class TitleSyncExtension implements Extension {
  instance!: Hocuspocus;

  // Maps document names to their observers and update managers
  private titleObservers: Map<string, (events: Y.YEvent<any>[]) => void> = new Map();
  private titleUpdateManagers: Map<string, TitleUpdateManager> = new Map();

  async onLoadDocument({ context, document }: { context: HocusPocusServerContext; document: Document }) {
    try {
      // initially for on demand migration of old titles to a new title field
      // in the yjs binary
      if (document.isEmpty("title")) {
        const { workspaceSlug, projectId } = context;
        const documentHandler = getDocumentHandler(context);
        if (!workspaceSlug || !projectId) return;
        const title = await documentHandler.fetchTitle({
          context,
          pageId: document.name,
        });
        if (title == null) return;
        const titleField = TiptapTransformer.toYdoc(
          generateTitleProsemirrorJson(title),
          "title",
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
  }: {
    document: Document;
    documentName: string;
    context: HocusPocusServerContext;
  }) {
    const { workspaceSlug, projectId } = context;

    // Exit if we don't have the required information
    if (!workspaceSlug || !projectId) return;

    const documentHandler = getDocumentHandler(context);

    // Create a title update manager for this document
    const updateManager = new TitleUpdateManager(documentName, documentHandler, context);

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
