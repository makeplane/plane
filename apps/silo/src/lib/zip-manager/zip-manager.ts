import { Store } from "@/worker/base";
import { extractZipTableOfContents, extractDirectoryFromZip, extractFileFromZip } from "./extractor";
import { StorageProvider } from "./storage-provider";
import { TZipFileNode } from "./types";
import { ZipStream } from "./zip-stream";

const TOC_KEY = "toc";

export const getKey = (fileId: string, key: string) => `SILO_ZIP_MANAGER_${fileId}_${key}`;

export class ZipManager {
  protected zipStream?: ZipStream;
  protected toc: string[] = [];
  private storageProvider: StorageProvider;
  private store: Store;

  private fileId?: string;

  constructor(storageProvider: StorageProvider, store: Store) {
    this.storageProvider = storageProvider;
    this.store = store;
  }

  /**
   * Initializes the zip manager, fetches the tables of contents and builds the file tree
   * @param fileId - The ID of the file to initialize
   */
  async initialize(fileId: string): Promise<void> {
    this.fileId = fileId;

    // Get file size
    const contentLength = await this.storageProvider.getContentLength(fileId);

    // Create zip stream
    this.zipStream = new ZipStream(this.storageProvider, fileId, contentLength);

    // Table of contents is a list of the file paths which are present in the zip file
    this.toc = await this.getTableOfContents();
  }

  /**
   * Gets the table of contents for the zip file
   * @returns The table of contents
   */
  async getTableOfContents(): Promise<string[]> {
    if (!this.fileId) {
      throw new Error("File ID not set");
    }

    if (!this.zipStream) {
      throw new Error("Zip stream not initialized");
    }

    // Let's check if our cache has the TOC
    const cachedTOC = await this.store.get(getKey(this.fileId, TOC_KEY));
    if (cachedTOC) {
      return JSON.parse(cachedTOC);
    }

    // If not, let's fetch it from the zip stream
    this.toc = await extractZipTableOfContents(this.zipStream);
    const ttl = 60 * 60 * 4; // 4 hours
    await this.store.set(getKey(this.fileId, TOC_KEY), JSON.stringify(this.toc), ttl);

    return this.toc;
  }

  /**
   * Cleans up the zip manager for the given file id
   * @param fileId - The id of the file
   */
  async cleanup(fileId: string): Promise<void> {
    await this.store.del(getKey(fileId, TOC_KEY));
  }

  /**
   * Gets content of all files directly within a directory, excluding subdirectories
   *
   * @param fileId - ID of the ZIP file
   * @param directoryNode - Directory node to extract content from
   * @returns Map of file paths to their content buffers
   */
  async getDirectoryContent(
    directoryNode: TZipFileNode,
    ignoredFileTypes: string[] = [],
    acceptedFileTypes?: string[]
  ): Promise<Map<string, Buffer>> {
    if (directoryNode.type !== "directory") {
      throw new Error("Node is not a directory");
    }

    if (!this.zipStream) {
      throw new Error("Manager not initialized");
    }

    // Extract files from the directory
    return await extractDirectoryFromZip(this.zipStream, directoryNode, ignoredFileTypes, acceptedFileTypes);
  }

  /**
   * Gets the content of a file from the zip file
   * @param filePath - The path of the file to get the content of
   * @returns The content of the file
   */
  async getFileContent(filePath: string): Promise<Buffer> {
    if (!this.zipStream) {
      throw new Error("Manager not initialized");
    }

    return extractFileFromZip(this.zipStream, filePath);
  }
}
