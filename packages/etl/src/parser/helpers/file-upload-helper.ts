import axios from "axios";
import { Client } from "@plane/sdk";

export type FileHelperConfig = {
  planeClient?: Client; // Type should match your actual client type
  workspaceSlug?: string;
  projectId?: string;

  fileDownloadHeaders?: Record<string, string>;
  externalSource?: string;
  externalId?: string;
};

export class FileHelper {
  protected config: FileHelperConfig;

  constructor(config: FileHelperConfig) {
    this.config = config;
  }

  /**
   * Downloads a file from a URL and uploads it to Plane
   * @param url The URL to download the file from
   * @param fileType The type of file (e.g., "image", "document")
   * @returns The asset ID if successful, null otherwise
   */
  async downloadAndUploadFile(url: string, fileType: string = "image"): Promise<string | null> {
    if (!this.config.planeClient || !this.config.workspaceSlug) return null;

    try {
      const blob = await this.downloadFile(url, this.config.fileDownloadHeaders);
      if (!blob) return null;

      // Upload using AssetService
      const assetId = await this.config.planeClient.assets.uploadAsset(
        this.config.workspaceSlug,
        blob as any,
        fileType,
        blob.size,
        {
          external_source: this.config.externalSource,
          external_id: this.config.externalId,
          project_id: this.config.projectId,
        }
      );

      return assetId;
    } catch (error) {
      console.error(`Error uploading ${fileType}`, error);
      return null;
    }
  }

  /**
   * Downloads a file from a URL and returns it as a Blob
   * @param url The URL to download
   * @returns A Blob containing the file data, or undefined if download fails
   */
  protected async downloadFile(url: string, headers?: Record<string, string>): Promise<Blob | undefined> {
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "arraybuffer",
        headers: headers,
      });

      const buffer = Buffer.from(response.data);
      const blob = new Blob([buffer], { type: response.headers["content-type"] });
      return blob;
    } catch (e) {
      console.error("Asset download failed", e);
    }
  }

  /**
   * Creates a link from an asset ID
   * @param assetId The asset ID to create a link from
   * @returns The link
   */
  createLinkFromAssetId(baseUrl: string, assetId: string): string {
    return `${baseUrl}/api/assets/v2/workspaces/${this.config.workspaceSlug}/projects/${this.config.projectId}/${assetId}`;
  }
}
