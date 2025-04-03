import { DocumentHandler } from "@/core/types/document-handler";
import { DebounceManager } from "./debounce";
import { HocusPocusServerContext } from "@/core/types/common";
import { env } from "@/env";

/**
 * Manages title update operations for a single document
 * Handles debouncing, aborting, and force saving title updates
 */
export class TitleUpdateManager {
  private documentName: string;
  private documentHandler: DocumentHandler;
  private debounceManager: DebounceManager;
  private lastTitle: string | null = null;
  private context: HocusPocusServerContext;

  /**
   * Create a new TitleUpdateManager instance
   */
  constructor(
    documentName: string,
    documentHandler: DocumentHandler,
    context: HocusPocusServerContext,
    wait: number = 3000
  ) {
    this.context = context;
    this.documentName = documentName;
    this.documentHandler = documentHandler;

    // Set up debounce manager with logging
    this.debounceManager = new DebounceManager({
      wait,
      logPrefix: env.NODE_ENV === "development" ? `TitleManager[${documentName.substring(0, 8)}]` : "",
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
      console.log(`No updateTitle method found for document ${this.documentName}`);
      return;
    }

    try {
      console.log(`Starting title update for ${this.documentName} with: "${title}"`);

      await this.documentHandler.updateTitle({
        context: this.context,
        pageId: this.documentName,
        title,
        abortSignal: signal,
      });

      console.log(`Completed title update for ${this.documentName} with: "${title}"`);

      // Clear last title only if it matches what we just updated
      if (this.lastTitle === title) {
        this.lastTitle = null;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log(`Title update for ${this.documentName} was aborted`);
      } else {
        console.error(`Error updating title for ${this.documentName}:`, error);
      }
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
