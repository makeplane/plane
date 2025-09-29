import { S3Client } from "@aws-sdk/client-s3";
import { logger } from "@plane/logger";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
import { ENotionMigrationType, TNotionMigratorData } from "../types";
import { NotionPhaseOneMigrator } from "./phases/phase-one";
import { NotionPhaseTwoMigrator } from "./phases/phase-two";

/**
 * Notion Data Migrator
 *
 * This system imports Notion exports into Plane using a two-phase approach:
 *
 * Phase One: Structural Migration
 * - Builds the complete page hierarchy by processing the ZIP's table of contents
 * - Creates all pages with proper parent-child relationships but minimal content
 * - Uploads and caches all attachments (images, PDFs, etc.) for later reference
 * - Uses an atomic counter to track completion across distributed workers
 *
 * Phase Two: Content Migration
 * - Processes HTML content from each page and transforms it to Plane's format
 * - Links previously uploaded attachments within the page content
 * - Adds rich formatting, embeds, and maintains references between pages
 * - Creates the final rich content experience for users
 *
 * Structure and Node Types:
 * The migrator processes exports using a recursive, top-down approach:
 * 1. File nodes - Contain actual data in buffer form
 * 2. Directory nodes - Contain lists of children nodes
 *
 * Processing workflow:
 * - Transform data into Plane page format
 * - Create attachment or page nodes
 * - Process directory nodes after their children are handled
 *
 * NOTE: Page assets are stored in directories named after the page
 * Example: "Test Page 1ebe40603fb080f7b923d6179854906f.html" has assets in
 * "Test Page 1ebe40603fb080f7b923d6179854906f/" directory
 *
 * This requires passing parent node IDs from Plane during processing.
 */

export class NotionDataMigrator extends TaskHandler {
  mq: MQ;
  store: Store;
  s3Client: S3Client | undefined;

  constructor(mq: MQ, store: Store, s3Client: S3Client | undefined) {
    super();
    this.mq = mq;
    this.store = store;
    this.s3Client = s3Client;
  }

  /**
   * Handles a task to process a Notion export node
   * @param headers - Task metadata including job ID
   * @param data - Notion migrator data with node and parentPageId
   * @returns Promise resolving to true when processing is complete
   */
  async handleTask(headers: TaskHeaders, data: TNotionMigratorData): Promise<boolean> {
    const { jobId } = headers;
    const { type } = headers as unknown as { type: ENotionMigrationType };

    try {
      let migrator: NotionPhaseOneMigrator | NotionPhaseTwoMigrator;

      // Initialize the migrator based on the type
      switch (type) {
        case ENotionMigrationType.PHASE_ONE:
          migrator = new NotionPhaseOneMigrator(this.mq, this.store, this.s3Client);
          break;
        case ENotionMigrationType.PHASE_TWO:
          migrator = new NotionPhaseTwoMigrator(this.mq, this.store, this.s3Client);
          break;
      }

      if (!migrator) {
        logger.error(`Migrator not found for type ${type}`, {
          headers,
          data,
        });
        return false;
      }

      // Pass the migrator to the task handler
      return await migrator.handleTask(headers, data);
    } catch (error) {
      logger.error(`Error migrating job ${jobId}`, {
        error,
        jobId,
      });
      throw error;
    }
  }
}
