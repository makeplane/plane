import { E_JOB_STATUS } from "@plane/etl/core";
import { ContentParser } from "@plane/etl/parser";
import { TImportJob, TPage } from "@plane/types";
import { env } from "@/env";
import { getProjectPageUrl, getTeamspacePageUrl, getWorkspacePageUrl } from "@/helpers/urls";
import { TZipFileNode, ZipManager } from "@/lib/zip-manager";
import { logger } from "@/logger";
import { getAPIClientInternal } from "@/services/client";
import { TaskHeaders } from "@/types";
import { importTaskManger } from "@/worker";
import { EZipDriverType } from "../../drivers";
import { IZipImportDriver } from "../../drivers/types";
import {
  EDocImporterDestinationType,
  ENotionImporterKeyType,
  TDocImporterJobConfig,
  TNotionMigratorData,
} from "../../types";
import { getEmojiPayload } from "../../utils/html-helpers";
import { NotionMigratorBase, PhaseProcessingContext } from "./base";

const apiClient = getAPIClientInternal();

/*
 * Notion Data Migrator: Phase Two Implementation
 *
 * Purpose:
 * Phase Two handles the content migration from Notion exports to Plane. It parses the HTML content
 * of each page and creates a Plane page object making a patch call over the page tree that was created
 * in phase one of the migration task
 * The traversal strategy is extended from phase one, but phase two handles the content migration while
 * phase one handles the page tree and attachment migration first
 *
 * Key Operations:
 * 1. Segregates the children nodes into page nodes and directory nodes
 * 2. Gets the content of only html files
 * 3. Processes the page nodes and creates a Plane page object
 * 4. Processes the directory nodes and schedules new tasks for each directory node
 * 5. Deletes the leaf node counter when the processing is finished
 *
 * Includes two main function
 * - processPageNodes: Processes the page nodes and creates a Plane page object
 * - processDirectoryNodes: Processes the directory nodes and schedules new tasks for each directory node
 */
export class NotionPhaseTwoMigrator extends NotionMigratorBase {
  /**
   * Processes the nodes for the second phase of the migration
   * @param context - The context of the migration
   * @param data - The data of the migration
   */
  protected async processNodes(context: PhaseProcessingContext, data: TNotionMigratorData): Promise<void> {
    const { currentNode, fileId, job, headers, zipManager, zipDriver } = context;
    const { type } = data;

    // Segregate the children nodes into attachment nodes, page nodes and directory nodes
    const { pageNodes, directoryNodes } = await this.segregateChildrenNodes(currentNode);

    const { pageMap, assetMap } = await this.getPageMapAndAssetMap(job.id, fileId);
    const contentMap = await zipManager.getDirectoryContent(currentNode, [], ["html"]);

    // Process all children nodes and perform desired actions
    await this.processPageNodes(
      fileId,
      job as TImportJob<TDocImporterJobConfig>,
      zipDriver,
      contentMap,
      pageNodes,
      pageMap,
      assetMap
    );
    await this.processDirectoryNodes(
      job as TImportJob<TDocImporterJobConfig>,
      fileId,
      headers,
      zipManager,
      directoryNodes,
      type
    );

    /*
     * Here we are checking the depth of the node as 1, as
     * from the tree building, we add a pseude root node at top, which holds
     * the depth of 0, we don't consider that for page creation, hence we
     * check for depth 1
     */
    if (currentNode.depth === 1)
      await this.addRootNodeUrlToJobConfig(job as TImportJob<TDocImporterJobConfig>, currentNode, pageMap);
  }

  /*=================== Node Processors ===================*/
  /*
   * Creates Plane pages from HTML page nodes and caches them in the store
   * for future reference
   * @param job - Import job containing workspace and project information
   * @param pageNodes - Array of HTML page nodes to process
   * @param contentMap - Map of file paths to content buffers
   * @returns Map of page names to their IDs in Plane
   */
  async processPageNodes(
    fileId: string,
    job: TImportJob<TDocImporterJobConfig>,
    zipDriver: IZipImportDriver,
    contentMap: Map<string, Buffer>,
    pageNodes: TZipFileNode[],
    pageMap: Map<string, string>,
    assetMap: Map<string, string>
  ): Promise<void> {
    const { id: jobId, workspace_slug } = job;
    // Get the map of the page and asset ids from the store
    const parser = zipDriver.getContentParser({
      fileId,
      assetMap,
      pageMap,
      workspaceSlug: workspace_slug,
      apiBaseUrl: env.API_BASE_URL,
    });

    try {
      // Transform all pages to ExPage format
      const pages = (
        await Promise.all(
          pageNodes.map(async (pageNode) => {
            const pageId = this.extractPageIdFromPath(pageNode.path, pageMap);
            if (!pageId) {
              logger.error(`Page id not found for page node ${pageNode.name}`, {
                jobId,
                pageNode,
              });
              return;
            }

            return this.getPageUpdatePayload(pageId, pageNode, parser, contentMap);
          })
        )
      ).filter(Boolean) as Partial<TPage>[];

      // // Use bulk create API if we have valid pages
      if (pages.length > 0) await this.updatePages(job, pages);
    } catch (error) {
      logger.error(`Error processing page nodes:`, {
        jobId,
        error,
      }); // How should we handle this error, in case we fail to process the page nodes?
      throw error;
    }
  }

  /**
   * Processes directory nodes by scheduling new tasks for each directory node
   * traversing down the tree of files
   * @param headers - Task headers for task registration
   * @param pageCreationResults - Map of page names to IDs for finding parent pages
   * @param directoryNodes - Array of directory nodes to process
   */
  async processDirectoryNodes(
    job: TImportJob<TDocImporterJobConfig>,
    fileId: string,
    headers: TaskHeaders,
    zipManager: ZipManager,
    directoryNodes: TZipFileNode[],
    type: EZipDriverType
  ): Promise<void> {
    if (directoryNodes.length === 0) {
      await this.decrementLeafNodeCounter(job.id, fileId);
      const leafNodeCount = await this.getLeafNodeCounter(job.id, fileId);

      if (leafNodeCount === 0 || leafNodeCount === null) {
        // We can conclude that we have finished processing the first phase
        await apiClient.importJob.updateImportJob(headers.jobId, {
          status: E_JOB_STATUS.FINISHED,
        });

        await this.cleanup(fileId, headers.jobId);
        await zipManager.cleanup(fileId);

        await apiClient.importReport.updateImportReport(job.report_id, {
          total_batch_count: 2,
          imported_batch_count: 2,
        });

        logger.info(`Finished processing the second phase for job ${headers.jobId}`);
      }

      return;
    }

    const directoryPromises = directoryNodes.map(async (directoryNode) => {
      try {
        await importTaskManger.registerTask(headers, {
          fileId,
          node: directoryNode,
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
   * Gets the web URL of the root node
   * @param job - Import job containing workspace information
   * @param pageId - The id of the page
   * @returns The web URL of the root node
   */
  getRootNodeWebUrl(job: TImportJob<TDocImporterJobConfig>, pageId: string): string {
    const { destination } = job.config;
    switch (destination.type) {
      case EDocImporterDestinationType.TEAMSPACE:
        return getTeamspacePageUrl(job.workspace_slug, destination.teamspace_id, pageId);
      case EDocImporterDestinationType.PROJECT:
        return getProjectPageUrl(job.workspace_slug, destination.project_id, pageId);
      case EDocImporterDestinationType.WIKI:
        return getWorkspacePageUrl(job.workspace_slug, pageId);
      default:
        throw new Error(`Invalid destination type:`, { cause: job });
    }
  }

  /**
   * Updates the job config with the root node url
   * @param job - Import job containing workspace information
   * @param rootNodeWebUrl - The web URL of the root node
   * @returns The updated job
   */
  async updateJobConfigForRootUrl(job: TImportJob<TDocImporterJobConfig>, rootNodeWebUrl: string): Promise<void> {
    await apiClient.importJob.updateImportJob(job.id, {
      config: {
        ...job.config,
        metadata: {
          ...job.config.metadata,
          rootNodeUrl: rootNodeWebUrl,
        },
      },
    });
  }

  /**
   * Extracts the page id from the path
   * @param path - The path of the page
   * @param pageMap - The map of the page ids
   * @returns The page id
   */
  extractPageIdFromPath(path: string, pageMap: Map<string, string>): string | undefined {
    const parts = path.split("/").pop();
    const pagePathWithoutExt = parts?.replace(/\.html$/, "");
    const pageId = pageMap.get(pagePathWithoutExt!);
    return pageId;
  }

  /**
   * Figure out the update mode and updates pages in Plane
   * @param job - Import job containing workspace information
   * @param pages - Array of page payloads to update
   * @returns Array of updated pages
   */
  async updatePages(job: TImportJob<TDocImporterJobConfig>, pages: Partial<TPage>[]): Promise<void> {
    const { destination } = job.config;

    switch (destination.type) {
      case EDocImporterDestinationType.TEAMSPACE:
        return apiClient.page.bulkUpdateTeamspacePages(job.workspace_slug, destination.teamspace_id, pages);
      case EDocImporterDestinationType.PROJECT:
        return apiClient.page.bulkUpdateProjectPages(job.workspace_slug, destination.project_id, pages);
      case EDocImporterDestinationType.WIKI:
        return apiClient.page.bulkUpdatePages(job.workspace_slug, pages);
      default:
        throw new Error(`Invalid destination type:`, { cause: job });
    }
  }

  async addRootNodeUrlToJobConfig(
    job: TImportJob<TDocImporterJobConfig>,
    currentNode: TZipFileNode,
    pageMap: Map<string, string>
  ): Promise<void> {
    const pageId = this.extractPageIdFromPath(currentNode.path, pageMap);

    if (!pageId) {
      logger.error(`Page id not found for root node ${currentNode.name}`, {
        jobId: job.id,
        currentNode,
      });
      return;
    }
    const rootNodeUrl = this.getRootNodeWebUrl(job, pageId);
    await this.updateJobConfigForRootUrl(job, rootNodeUrl);
  }

  /**
   * Gets the page map and asset map from the store
   * @param jobId - The id of the job
   * @param fileId - The id of the file
   * @returns The page map and asset map
   */
  async getPageMapAndAssetMap(
    jobId: string,
    fileId: string
  ): Promise<{ pageMap: Map<string, string>; assetMap: Map<string, string> }> {
    const [pageMap, assetMap] = await Promise.all([
      this.retrieveMap(this.store, jobId, fileId, ENotionImporterKeyType.PAGE),
      this.retrieveMap(this.store, jobId, fileId, ENotionImporterKeyType.ASSET),
    ]);

    return { pageMap, assetMap };
  }

  /**
   * Transforms a Notion HTML file node into a Plane page object
   * @param id - The id of the page
   * @param node - The HTML file node to transform
   * @param contentParser - The content parser to use
   * @param contentMap - Map of file paths to content buffers
   * @returns Plane page object or undefined if content not found
   */
  async getPageUpdatePayload(
    id: string,
    node: TZipFileNode,
    contentParser: ContentParser,
    contentMap: Map<string, Buffer>
  ): Promise<Partial<TPage> | undefined> {
    const content = contentMap.get(node.path) || "<p></p>";
    // Basic transformation logic - extract name from filename and convert content
    const nameWithoutExt = node.name.replace(/\.html$/, "");
    const parts = nameWithoutExt.split(" ");

    let pageName;
    if (parts.length > 1 && /^[a-f0-9]{32}$/i.test(parts[parts.length - 1])) {
      // Last part is a 32-character hex ID, remove it
      pageName = parts.slice(0, -1).join(" ");
    } else {
      // Keep as-is (no ID or meaningful last word)
      pageName = nameWithoutExt;
    }

    const htmlContent = content.toString();
    const emojiPayload = getEmojiPayload(htmlContent);
    const parsedContent = await contentParser.toPlaneHtml(htmlContent);

    // Create page in ExPage format
    return {
      id,
      name: pageName,
      description_html: parsedContent,
      logo_props: emojiPayload
        ? {
            emoji: emojiPayload.emoji,
            in_use: "emoji",
          }
        : undefined,
    };
  }
}
