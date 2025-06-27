import { DocumentHandler } from "@/core/types/document-handler";
import { DebounceManager } from "./debounce";
import { HocusPocusServerContext } from "@/core/types/common";
import { logger } from "@plane/logger";

/**
 * Manages title update operations for a single document
 * Handles debouncing, aborting, and force saving title updates
 */
export class TitleUpdateManager {
  private documentName: string;
  private context: HocusPocusServerContext;
  private documentHandler: DocumentHandler;
  private debounceManager: DebounceManager;
  private lastTitle: string | null = null;

  /**
   * Create a new TitleUpdateManager instance
   */
  constructor(
    documentName: string,
    context: HocusPocusServerContext,
    documentHandler: DocumentHandler,
    wait: number = 5000
  ) {
    this.documentName = documentName;
    this.context = context;
    this.documentHandler = documentHandler;

    // Set up debounce manager with logging
    this.debounceManager = new DebounceManager({
      wait,
      logPrefix: `TitleManager[${documentName.substring(0, 8)}]`,
    });
  }

  /**
   * Schedule a debounced title update
   */
  scheduleUpdate(title: string): void {
    // Store the latest title
    this.lastTitle = title;

    // Schedule the update with the debounce manager
    this.debounceManager.schedule(this.updateTitle.bind(this), title);
  }

  /**
   * Update the title - will be called by the debounce manager
   */
  private async updateTitle(title: string, signal?: AbortSignal): Promise<void> {
    if (!this.documentHandler.updateTitle) {
      logger.warn(`No updateTitle method found for document ${this.documentName}`);
      return;
    }

    try {
      await this.documentHandler.updateTitle({
        context: this.context,
        pageId: this.documentName,
        title: title,
        abortSignal: signal,
      });

      // Clear last title only if it matches what we just updated
      if (this.lastTitle === title) {
        this.lastTitle = null;
      }
    } catch (error) {
      console.error(`Error updating title for ${this.documentName}:`, error);
    }
  }

  /**
   * Force save the current title immediately
   */
  async forceSave(): Promise<void> {
    // Ensure we have the current title
    if (!this.lastTitle) {
      return;
    }

    // Use the debounce manager to flush the operation
    await this.debounceManager.flush(this.updateTitle.bind(this));
  }

  /**
   * Cancel any pending updates
   */
  cancel(): void {
    this.debounceManager.cancel();
    this.lastTitle = null;
  }
}
