import mimetics from "mimetics";
import { ExPage } from "@plane/sdk";
import { TImportJob, TPage } from "@plane/types";
import {
  ENotionImporterKeyType,
  ENotionMigrationType,
  TAssetInfo,
  TNotionMigratorData,
} from "@/apps/notion-importer/types";
import { protect } from "@/lib/errors";
import { TZipFileNode } from "@/lib/zip-manager";
import { logger } from "@/logger";
import { getAPIClientInternal } from "@/services/client";
import { TaskHeaders } from "@/types";
import { importTaskManger } from "@/worker";
import { EZipDriverType } from "../../drivers";
import { NotionMigratorBase, PhaseProcessingContext } from "./base";

const apiClient = getAPIClientInternal();

/**
 * Notion Data Migrator: Phase One Implementation
 *
 * Purpose:
 * Phase One handles the initial structural migration from Notion exports to Plane. It creates the
 * hierarchical structure of pages and uploads all attachments, laying the groundwork for Phase Two.
 *
 * Key Operations:
 * 1. Extracts the Table of Contents (TOC) from the zip file and caches it for efficiency
 * 2. Processes and creates all page entities in the correct hierarchical structure
 * 3. Uploads all attachment files (images, PDFs, etc.) and stores their reference IDs
 * 4. Deliberately skips processing HTML content - this is handled in Phase Two
 *
 * Preparation for Phase Two:
 * - Caches the IDs of all created pages so Phase Two can find them quickly
 * - Stores attachment references to allow proper embedding in page content
 * - All this cached data enables Phase Two to efficiently parse HTML and create rich content
 *
 * Completion Tracking:
 * - Uses a distributed atomic counter to track processing progress
 * - Each "leaf node" (a directory with no subdirectories) decrements the counter when processed
 * - When the counter reaches zero, Phase One is complete and Phase Two is triggered
 * - This counter-based approach enables reliable completion detection across multiple workers
 *
 * Includes three main functions
 * - processPageNodes: Processes the page nodes and creates a Plane page object
 * - processDirectoryNodes: Processes the directory nodes and schedules new tasks for each directory node
 * - processAttachmentNodes: Processes the attachment nodes and uploads them to Plane
 */
export class NotionPhaseOneMigrator extends NotionMigratorBase {
  /**
   * Processes the nodes for the first phase of the migration
   * @param context - The context of the migration
   * @param data - The data of the migration
   */
  async processNodes(context: PhaseProcessingContext, data: TNotionMigratorData): Promise<void> {
    const { parentPageId, type } = data;
    const { currentNode, fileId, job, headers, zipManager } = context;

    // Segregate the children nodes into attachment nodes, page nodes and directory nodes
    const { pageNodes, directoryNodes, attachmentNodes } = await this.segregateChildrenNodes(currentNode);

    /*
     * As a consideration of phase 1, we are not going to get the content of the html files,
     * we only need to create the tree of the pages nodes and upload the attachments, so there
     * is no need to get the content of the html files at all
     * In phase 2, we will only get the content of the html files as we need to create the pages,
     * parse the html content and make a patch
     */
    const contentMap = await zipManager.getDirectoryContent(currentNode, ["html"]);

    // Process all children nodes and perform desired actions
    const pageCreationResults = await this.processPageNodes(fileId, job as TImportJob, parentPageId, pageNodes);
    await this.processAttachmentNodes(fileId, currentNode, job as TImportJob, attachmentNodes, contentMap);
    await this.processDirectoryNodes(job as TImportJob, fileId, headers, pageCreationResults, directoryNodes, type);
  }

  /*=================== Node Processors ===================*/
  /**
   * Creates Plane pages from HTML page nodes and caches them in the store
   * for future reference
   * @param job - Import job containing workspace and project information
   * @param client - Authenticated Plane API client
   * @param parentPageId - Optional ID of parent page for hierarchy
   * @param pageNodes - Array of HTML page nodes to process
   * @param contentMap - Map of file paths to content buffers
   * @returns Map of page names to their IDs in Plane
   */
  async processPageNodes(
    fileId: string,
    job: TImportJob,
    parentPageId: string | undefined,
    pageNodes: TZipFileNode[]
  ): Promise<Map<string, string>> {
    if (!pageNodes.length) {
      return new Map();
    }

    try {
      // Transform all pages to ExPage format
      const pages = pageNodes
        .map((pageNode) => this.createPageFromNode(job, pageNode, parentPageId, job.initiator_id))
        .filter(Boolean) as Partial<TPage>[];

      // Use bulk create API if we have valid pages
      if (pages.length > 0) {
        const createdPages = (await apiClient.page.bulkCreatePages(job.workspace_slug, pages)) as ExPage[];
        /*
         * Path represents maximum information that we have about a page,
         * from that we can get the page, name and all the information necessary
         * hence, we are setting page map with the path rather than the name, which
         * used to be there, and have not changed the name of the page, which is the
         * name of the page in the html file
         */
        const pageMap = new Map(
          createdPages.map((page) => {
            let identifier = page.name;
            if (page.external_id) {
              const path = page.external_id.split("/").pop()!;
              const pathWithoutExtension = path.replace(/\.html$/, "");
              identifier = pathWithoutExtension;
            }
            return [identifier, page.id];
          })
        );

        if (pageMap.size > 0) await this.setCacheObjects(job.id, fileId, ENotionImporterKeyType.PAGE, pageMap);
        return pageMap;
      }

      return new Map();
    } catch (error) {
      logger.error(`Error processing page nodes:`, {
        jobId: job.id,
        error,
      }); // How should we handle this error, in case we fail to process the page nodes?
      throw error;
    }
  }

  /**
   * Creates assets from attachment nodes and caches them in the store
   * @param root - The root node being processed
   * @param job - Import job containing workspace information
   * @param client - Authenticated Plane API client
   * @param attachmentNodes - Array of attachment nodes to process
   * @param contentMap - Map of file paths to content buffers
   */
  async processAttachmentNodes(
    fileId: string,
    root: TZipFileNode,
    job: TImportJob,
    attachmentNodes: TZipFileNode[],
    contentMap: Map<string, Buffer>
  ): Promise<void> {
    if (!attachmentNodes.length) {
      return;
    }

    const result = new Map<string, string>();

    /*
     * In notion, the parent path is associated with the image or the asset, in the
     * given html, hence if we need to get the image, we need to get the parent path
     * and then the name of the image, which is the last part of the path
     */
    const parentPath = root.path.split("/").pop();

    for (const node of attachmentNodes) {
      // Check if the content is present in the content map
      const content = contentMap.get(node.path);
      // skip processing if content is empty (Buffer.alloc(0)) or undefined
      if (!content || content.length === 0) {
        logger.error(`Content not found for attachment node ${node.path}`, {
          jobId: job.id,
        });
        continue;
      }

      try {
        // Parse the content to get the mime type
        const parsed = mimetics.parse(content);
        // Upload the asset and get the asset id
        const assetId = await protect(
          apiClient.asset.uploadAsset.bind(apiClient.asset),
          job.workspace_slug,
          new File([content], node.name, {
            type: parsed?.mime,
          }),
          node.name,
          content.length,
          job.initiator_id
        );

        const assetInfo: TAssetInfo = {
          id: assetId,
          name: node.name,
          type: parsed?.mime ?? "application/octet-stream",
          size: content.length,
        };

        result.set(`${parentPath}/${node.name}`, JSON.stringify(assetInfo));
      } catch (error) {
        logger.error(`Error uploading asset for job ${job.id} and node ${node.name}`, {
          jobId: job.id,
          error,
        }); // TODO: What do we do with this error?
      }
    }

    if (result.size > 0) await this.setCacheObjects(job.id, fileId, ENotionImporterKeyType.ASSET, result);
  }

  /**
   * Processes directory nodes by scheduling new tasks for each directory node
   * traversing down the tree of files
   * @param headers - Task headers for task registration
   * @param pageCreationResults - Map of page names to IDs for finding parent pages
   * @param directoryNodes - Array of directory nodes to process
   */
  async processDirectoryNodes(
    job: TImportJob,
    fileId: string,
    headers: TaskHeaders,
    pageCreationResults: Map<string, string>,
    directoryNodes: TZipFileNode[],
    type: EZipDriverType
  ): Promise<void> {
    if (!directoryNodes.length) {
      await this.decrementLeafNodeCounter(job.id, fileId);
      const leafNodeCount = await this.getLeafNodeCounter(job.id, fileId);

      if (!leafNodeCount) {
        // We can conclude that we have finished processing the first phase
        await this.deleteLeafNodeCounter(job.id, fileId);

        // Schedule a job for phase 2 import
        const data: TNotionMigratorData = { fileId, type }; // For type assertion

        // Mark the job as progressing
        await apiClient.importReport.updateImportReport(job.report_id, {
          total_batch_count: 2,
          imported_batch_count: 1,
        });

        await importTaskManger.registerTask(
          {
            ...headers,
            type: ENotionMigrationType.PHASE_TWO,
          },
          data
        );

        logger.info(`Finished processing the first phase for job ${headers.jobId}`);
        return;
      }
    }

    const directoryPromises = directoryNodes.map(async (directoryNode) => {
      /*
       * We need to get the parent page id from the pageCreationResults map,
       * which we can use to pass to the page ids of the children nodes such that
       * they are created in the correct hierarchy
       */
      const directoryPath = directoryNode.path.split("/").pop();
      const parentPageId = pageCreationResults.get(directoryPath!);
      if (!parentPageId) {
        logger.error(`Parent page id not found for directory node ${directoryNode.name}`, {
          jobId: headers.jobId,
          node: directoryNode,
        });
        throw new Error(`Parent page id not found for directory node ${directoryNode.name}`);
      }

      try {
        await importTaskManger.registerTask(headers, {
          fileId,
          node: directoryNode,
          parentPageId,
          type,
        });
      } catch (error) {
        logger.error(`Error registering task for directory node ${directoryNode.name}`, {
          // TODO: How should we handle this error?
          jobId: headers.jobId,
          error,
        }); // TODO: How should we handle this error?
      }
    });

    await Promise.all(directoryPromises.filter(Boolean));
  }

  /**
   * Transforms a Notion HTML file node into a Plane page object
   * @param node - The HTML file node to transform
   * @param parentPageId - Optional ID of parent page for hierarchy
   * @param contentMap - Map of file paths to content buffers
   * @returns Plane page object or undefined if content not found
   */
  createPageFromNode(
    job: TImportJob,
    node: TZipFileNode,
    parentPageId: string | undefined,
    userId: string
  ): Partial<ExPage> | undefined {
    // Basic transformation logic - extract name from filename and convert content
    const pageName = node.name.replace(/\.html$/, "");
    const strippedPath = node.path.split("/").pop();
    // const pageName = node.path;

    // Create page in ExPage format
    return {
      name: pageName,
      access: 0,
      parent_id: parentPageId,
      external_id: `${job.id}/${strippedPath}`,
      owned_by: userId,
      description_html: "<p></p>",
    };
  }
}
