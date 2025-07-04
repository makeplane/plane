// Base Class
import { S3Client } from "@aws-sdk/client-s3";
import { E_JOB_STATUS } from "@plane/etl/core";
import { Client } from "@plane/sdk";
import { TImportJob, TWorkspaceCredential } from "@plane/types";
import { env } from "@/env";
import { getJobCredentials, getJobData } from "@/helpers/job";
import { createZipManager, EZipNodeType, TZipFileNode, ZipManager } from "@/lib/zip-manager";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { TaskHandler, TaskHeaders } from "@/types";
import { MQ, Store } from "@/worker/base";
import { EZipDriverType, ZipDriverFactory } from "../../drivers";
import { IZipImportDriver } from "../../drivers/types";
import { ENotionImporterKeyType, TNotionImportConfig, TNotionMigratorData } from "../../types";
import { getKey } from "../../utils";

const apiClient = getAPIClient();

// Context for processing nodes (everything a phase implementation needs)
export interface PhaseProcessingContext {
  fileId: string;
  jobId: string;
  job: TImportJob;
  client: Client;
  zipManager: ZipManager;
  zipDriver: IZipImportDriver;
  currentNode: TZipFileNode;
  headers: TaskHeaders;
}

/**
 * Notion Data Migrator Base Class
 *
 * Purpose:
 * This is the base class for all the phases of the Notion data migration task
 * It contains the common functionality shared between phase one and phase two,
 * along with that all the traversal logic supporting both the phases is contained here
 *
 * For implementing a new phase, extending this base class will be the best option
 */
export abstract class NotionMigratorBase extends TaskHandler {
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
   * Gets the job data for the given job ID, the function
   * caches and stores the job data in the store, for future use
   * along with that we cache the credentials for the job
   * @param jobId - The ID of the job
   * @returns The job data
   */
  async getCachedJobData(jobId: string): Promise<TImportJob<unknown> | undefined> {
    const key = getKey(jobId, ENotionImporterKeyType.JOB);
    const job = await this.store.get(key);
    if (job) {
      return JSON.parse(job) as TImportJob;
    }
    const jobData = await getJobData(jobId);
    // When we are able to get the job data, we will mark the status as processing
    // and update the job data in the store
    if (jobData && jobData.status !== E_JOB_STATUS.PROGRESSING) {
      await Promise.all([
        apiClient.importJob.updateImportJob(jobId, {
          status: E_JOB_STATUS.PROGRESSING,
        }),
        apiClient.importReport.updateImportReport(jobData.report_id, {
          start_time: new Date().toISOString(),
        }),
      ]);
    }
    this.store.set(key, JSON.stringify(jobData), 60 * 60 * 4); // 4 hours
    return jobData;
  }

  /**
   * Gets the job credentials from the store
   * @param job - The job to get the credentials for
   * @returns The job credentials
   */
  async getCachesJobCredentials(job: TImportJob): Promise<TWorkspaceCredential | undefined> {
    const credentialsKey = getKey(job.id, ENotionImporterKeyType.JOB_CREDENTIALS);
    const credentials = await this.store.get(credentialsKey);

    if (credentials) {
      return JSON.parse(credentials) as TWorkspaceCredential;
    }

    const credentialsData = await getJobCredentials(job as TImportJob);
    this.store.set(credentialsKey, JSON.stringify(credentialsData), 60 * 60 * 4); // 4 hours
    return credentialsData;
  }

  /**
   * Common implementation of handleTask for all phases
   * Handles initial setup and delegates phase-specific processing to processNodes
   * @param headers - Task metadata including job ID
   * @param data - Notion migrator data with node and optional parentPageId
   * @returns Promise resolving to true when processing is complete
   */
  async handleTask(headers: TaskHeaders, data: TNotionMigratorData): Promise<boolean> {
    const { jobId } = headers;
    const { type } = data

    try {
      // Get job data
      const job = await this.getCachedJobData(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      const config = job.config as TNotionImportConfig;
      if (!config.fileId) {
        throw new Error(`Job ${jobId} has no fileId`);
      }

      const fileId = config.fileId;

      // Get the services required for the migration
      const zipManager = await this.getZipManager(fileId);
      const client = await this.getPlaneClient(job as TImportJob);
      const zipDriver = await this.getZipDriver(zipManager, type as EZipDriverType);

      // Determine the current node to process
      let currentNode: TZipFileNode | undefined = data.node;
      if (!currentNode) {
        // Get the file tree and initialize counter
        currentNode = await zipDriver.buildFileTree();
        if (!currentNode) {
          throw new Error(`Current node not found for job ${jobId}`);
        }
        const leafNodeCount = await this.countLeafNodesFromRoot(currentNode);
        await this.setLeafNodeCounter(fileId, leafNodeCount);
      }

      if (!currentNode) {
        throw new Error(`Current node not found for job ${jobId}`);
      }

      // Create processing context with everything needed by phase implementations
      const context: PhaseProcessingContext = {
        fileId,
        jobId,
        job: job as TImportJob,
        client,
        zipManager,
        zipDriver,
        currentNode,
        headers,
      };

      // Call phase-specific implementation
      try {
        await this.processNodes(context, data);
      } catch (error) {
        logger.error(`Error migrating job ${jobId}`, {
          error,
          jobId,
        });
        await this.cleanup(context.fileId, context.headers.jobId);
        await context.zipManager.cleanup(context.fileId);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error(`Error migrating job ${jobId}`, {
        error,
        jobId,
      });
      await apiClient.importJob.updateImportJob(jobId, {
        status: E_JOB_STATUS.ERROR,
      });

      return false
    }
  }

  /**
   * Process nodes in a phase-specific way
   * This is the main extension point for phase-specific implementations
   * @param context - All the context needed for processing
   * @param data - Phase-specific data passed to handleTask
   */
  protected abstract processNodes(context: PhaseProcessingContext, data: TNotionMigratorData): Promise<void>;

  /**
   * Creates and initializes a zip manager for accessing Notion export files
   * @param fileId - The ID of the zip file to process
   * @returns Promise resolving to initialized ZipManager
   */
  async getZipManager(fileId: string): Promise<ZipManager> {
    if (!this.s3Client) {
      throw new Error("S3 client not initialized");
    }

    const manager = createZipManager({
      type: "s3",
      bucket: env.AWS_S3_BUCKET_NAME,
      s3Client: this.s3Client,
    });

    await manager.initialize(fileId);
    return manager;
  }

  /**
   * Gets the zip driver for the given file id
   * @param fileId - The id of the file
   * @returns The zip driver
   */
  async getZipDriver(manager: ZipManager, type: EZipDriverType): Promise<IZipImportDriver> {
    return ZipDriverFactory.getDriver(type, manager);
  }

  /**
   * Creates an authenticated Plane API client
   * @param job - The import job containing credentials
   * @returns Promise resolving to authenticated Plane client
   * @throws Error if access token is not available
   */
  async getPlaneClient(job: TImportJob): Promise<Client> {
    const credentials = await this.getCachesJobCredentials(job as TImportJob);
    if (!credentials?.target_access_token) {
      throw new Error(`Job ${job.id} has no target access token`);
    }
    const client = new Client({
      baseURL: env.API_BASE_URL,
      apiToken: credentials.target_access_token || "",
    });

    return client;
  }

  /**
   * Sets a map of objects in the store
   * @param fileId - The ID of the file
   * @param type - The type of objects to set
   * @param objects - The map of objects to set
   */
  async setCacheObjects(fileId: string, type: ENotionImporterKeyType, objects: Map<string, string>): Promise<void> {
    const key = getKey(fileId, type);
    const ttl = 60 * 60 * 4; // 4 hours
    await this.store.setMap(key, objects, ttl);
  }

  /**
   * Categorizes a node's children into pages, attachments, and directories
   * @param node - The parent node whose children need to be categorized
   * @returns Object containing arrays of the three node types
   */
  async segregateChildrenNodes(node: TZipFileNode): Promise<{
    pageNodes: TZipFileNode[];
    directoryNodes: TZipFileNode[];
    attachmentNodes: TZipFileNode[];
  }> {
    if (!node.children?.length) {
      logger.info(`No children found for node ${node.name}`, {
        node,
      });
      return {
        attachmentNodes: [],
        pageNodes: [],
        directoryNodes: [],
      };
    }

    const pageNodes: TZipFileNode[] = [];
    const directoryNodes: TZipFileNode[] = [];
    const attachmentNodes: TZipFileNode[] = [];

    for (const child of node.children) {
      switch (child.type) {
        case EZipNodeType.DIRECTORY:
          directoryNodes.push(child);
          break;
        case EZipNodeType.FILE:
          if (child.name.endsWith(".html") || child.path.endsWith(".html")) {
            pageNodes.push(child);
          } else {
            attachmentNodes.push(child);
          }
          break;
        default:
          logger.warn(`Unexpected node type: ${child.type}`, {
            node,
            child,
          });
          break;
      }
    }

    return { pageNodes, directoryNodes, attachmentNodes };
  }

  /**
   * Cleans up the store for the given file id
   * Removes
   * - Page map
   * - Asset map
   * - Leaf node counter
   * @param fileId - The id of the file
   * @param types - The types of objects to remove
   */
  async cleanup(fileId: string, jobId: string) {
    const types = [ENotionImporterKeyType.PAGE, ENotionImporterKeyType.ASSET, ENotionImporterKeyType.LEAF_NODE_COUNTER, ENotionImporterKeyType.JOB];
    for (const type of types) {
      if (type === ENotionImporterKeyType.JOB || type === ENotionImporterKeyType.JOB_CREDENTIALS) {
        const key = getKey(jobId, type);
        await this.store.del(key);
      } else {
        const key = getKey(fileId, type);
        await this.store.del(key);
      }
    }
  }

  /**
   * Sets the leaf node counter in the store
   * @param fileId - The id of the file
   * @param leafNodeCount - The number of leaf nodes
   */
  async setLeafNodeCounter(fileId: string, leafNodeCount: number) {
    const key = getKey(fileId, ENotionImporterKeyType.LEAF_NODE_COUNTER);
    const ttl = 60 * 60 * 4; // 4 hours
    await this.store.initCounter(key, leafNodeCount, ttl);
  }

  /**
   * Decrements the leaf node counter in the store
   * @param fileId - The id of the file
   */
  async decrementLeafNodeCounter(fileId: string) {
    const key = getKey(fileId, ENotionImporterKeyType.LEAF_NODE_COUNTER);
    await this.store.decrementCounter(key);
  }

  /**
   * Gets the leaf node counter from the store
   * @param fileId - The id of the file
   * @returns The number of leaf nodes
   */
  async getLeafNodeCounter(fileId: string): Promise<number | null> {
    const key = getKey(fileId, ENotionImporterKeyType.LEAF_NODE_COUNTER);
    return await this.store.getCounter(key);
  }

  /**
   * Deletes the leaf node counter from the store
   * @param fileId - The id of the file
   */
  async deleteLeafNodeCounter(fileId: string) {
    const key = getKey(fileId, ENotionImporterKeyType.LEAF_NODE_COUNTER);
    await this.store.del(key);
  }

  /**
   * Retrieves a map from the store
   * @param store - The store to retrieve the map from
   * @param fileId - The id of the file
   * @param keyType - The type of map to retrieve
   * @returns The map
   */
  async retrieveMap(store: Store, fileId: string, keyType: ENotionImporterKeyType): Promise<Map<string, string>> {
    const mapKey = getKey(fileId, keyType);
    try {
      const map = await store.getMap(mapKey);
      return map || new Map();
    } catch (error) {
      logger.error(`Failed to retrieve ${keyType} map`, { fileId, error });
      return new Map();
    }
  }

  /**
   * Counts the number of leaf nodes from the root node
   * @param root - The root node
   * @returns The number of leaf nodes
   */
  async countLeafNodesFromRoot(root: TZipFileNode): Promise<number> {
    const queue: TZipFileNode[] = [root];
    let count = 0;

    while (queue.length) {
      const node = queue.shift();
      if (!node) continue;

      // Check if this node has any directory children
      const hasDirectoryChildren = node.children?.some((child) => child.type === EZipNodeType.DIRECTORY);

      if (hasDirectoryChildren) {
        // If it has directory children, add them to the queue
        const directoryChildren = node.children?.filter((child) => child.type === EZipNodeType.DIRECTORY) || [];
        queue.push(...directoryChildren);
      } else {
        // It's a leaf node (no directory children)
        count++;
      }
    }

    return count;
  }
}
