import { HTMLElement } from "node-html-parser";
import { v4 as uuidv4 } from "uuid";
import { IParserExtension } from "@plane/etl/parser";
import { logger } from "@plane/logger";
import { TAssetInfo, TDocContentParserConfig } from "@/apps/notion-importer/types";
import {
  CONFLUENCE_DRAWIO_CONTAINER_CLASS,
  CONFLUENCE_DRAWIO_CONTAINER_ID_PREFIXES,
  CONFLUENCE_DRAWIO_SCRIPT_SELECTOR,
} from "@/apps/notion-importer/utils/html-helpers";
import { TConfluenceAttachmentConfig } from "./extract-attachments-config";

enum EDrawioMode {
  DIAGRAM = "diagram",
  BOARD = "board",
}

/**
 * @overview This extension is used to extract the drawio embed from the confluence page
 * Essentially the embed is encapsulated in a container with the specific class of ap-container,
 * There are two child nodes, that need to be taken care of,
 * 1. ap-content, which keeps the id of the iframe
 * 2. script tag, which includes the script that can provide us with metadata
 * for the file that we want to reference in the tag.
 */
export class ConfluenceExtractDrawioEmbedExtension implements IParserExtension {
  drawioContainerClass = CONFLUENCE_DRAWIO_CONTAINER_CLASS;
  drawioScriptSelector = CONFLUENCE_DRAWIO_SCRIPT_SELECTOR;
  drawioContainerIdPrefixes = CONFLUENCE_DRAWIO_CONTAINER_ID_PREFIXES;

  constructor(private config: TDocContentParserConfig) {
    this.config = config;
  }

  /**
   * Checks if the node is a drawio embed container
   * @param node - The node to check
   * @returns True if the node is a drawio embed container, false otherwise
   */
  shouldParse(node: HTMLElement): boolean {
    const isAPContainer = node.getAttribute("class")?.includes(this.drawioContainerClass) ?? false;
    const isDrawioContainer = this.drawioContainerIdPrefixes.some(
      (prefix) => node.getAttribute("id")?.includes(prefix) ?? false
    );
    return isAPContainer && isDrawioContainer;
  }

  /**
   * Extracts the drawio embed from the node
   * @param node - The node to extract the drawio embed from
   * @returns The drawio embed component
   */
  async mutate(node: HTMLElement): Promise<HTMLElement> {
    try {
      const scriptContent = this.extractScriptContent(node);

      // Get the filename from the script content
      const fileName = this.extractFileNameFromScriptContent(scriptContent);
      const attachmentMap = this.extractAttachmentMapFromContext();

      // Get the associated details for the filename
      const mode = this.extractFileModeFromNode(node);
      const xmlAssetInfo = this.extractXMLAssetInfo(fileName, attachmentMap);
      const imgAssetInfo = this.extractImgAssetInfo(fileName, attachmentMap);

      // Create the drawio component
      return this.createDrawIoComponent(xmlAssetInfo.id, imgAssetInfo.id, mode);
    } catch (error) {
      logger.error(`Error extracting drawio embed from node:`, { error });
      return node;
    }
  }

  /**
   * Extracts the script content from the node
   * @param node - The node to extract the script content from
   * @throws An error if the script tag is not found
   * @returns The script content
   */
  private extractScriptContent(node: HTMLElement): string {
    const scriptContent = node.querySelector(this.drawioScriptSelector)?.innerHTML;
    if (!scriptContent) {
      throw new Error("Script tag not found");
    }
    return scriptContent;
  }

  /**
   * Extracts the file name from the script content
   * @param scriptContent - The script content
   * @throws An error if the productCtx line is not found
   * @throws An error if the diagram display name is not found
   * @returns The file name
   */
  private extractFileNameFromScriptContent(scriptContent: string): string {
    const productCtxLine = this.extractProductCtxLineFromScriptContent(scriptContent);

    if (!productCtxLine) {
      throw new Error("productCtx line not found");
    }

    const diagramDisplayName = this.extractDiagramDisplayNameFromProductCtxLine(productCtxLine);
    if (!diagramDisplayName) {
      throw new Error("Diagram display name not found");
    }
    return diagramDisplayName;
  }

  /**
   * Extracts the attachment map from the context
   * @returns The attachment map
   */
  private extractAttachmentMapFromContext(): TConfluenceAttachmentConfig[] {
    const attachmentMap = this.config.context?.get("attachments");
    return JSON.parse(attachmentMap || "[]") as TConfluenceAttachmentConfig[];
  }

  /**
   * Extracts the asset info from the filename
   * @param fileName - The filename
   * @returns The asset info
   */
  private extractFileModeFromNode(node: HTMLElement): EDrawioMode {
    const id = node.getAttribute("id");
    if (id?.includes("sketch")) {
      return EDrawioMode.BOARD;
    }

    return EDrawioMode.DIAGRAM;
  }

  /**
   * Gets the XML asset info from the filename
   * @param fileName - The filename
   * @returns The XML asset info
   */
  private extractXMLAssetInfo(fileName: string, attachmentMap: TConfluenceAttachmentConfig[]) {
    const fileReference = attachmentMap?.find(
      (attachment: TConfluenceAttachmentConfig) => attachment.fileName === fileName
    );
    if (!fileReference) {
      throw new Error(`File reference not found for file name: ${fileName}`);
    }
    return this.extractAssetInfoFromFilename(fileReference);
  }

  /**
   * Gets the image asset info from the filename
   * @param fileName - The filename
   * @returns The image asset info
   */
  private extractImgAssetInfo(fileName: string, attachmentMap: TConfluenceAttachmentConfig[]) {
    const fileReference = attachmentMap?.find(
      (attachment: TConfluenceAttachmentConfig) => attachment.fileName === `${fileName}.png`
    );
    if (!fileReference) {
      throw new Error(`File reference not found for file name: ${fileName}`);
    }
    return this.extractAssetInfoFromFilename(fileReference);
  }

  /**
   * Gets the asset info from the filename
   * @param fileReference - The file reference
   * @returns The asset info
   */
  private extractAssetInfoFromFilename(fileReference: TConfluenceAttachmentConfig) {
    const normalizedFilePath = this.normalizeFilePath(fileReference?.href || "");
    const assetInfo = JSON.parse(this.config.assetMap.get(normalizedFilePath) || "{}") as TAssetInfo;
    return assetInfo;
  }

  /**
   * Creates the drawio component
   * @param xmlSrc - The XML source
   * @param imgSrc - The image source
   * @returns The drawio component
   */
  private createDrawIoComponent(xmlSrc: string, imgSrc: string, mode = EDrawioMode.DIAGRAM) {
    const uuid = uuidv4();

    const component = new HTMLElement("drawio-component", {}, "");
    component.setAttribute("id", uuid);
    component.setAttribute("data-xml-src", xmlSrc);
    component.setAttribute("data-image-src", imgSrc);
    component.setAttribute("data-mode", mode);
    return component;
  }

  /**
   * Extracts the productCtx line from the script content
   * @param scriptContent - The script content
   * @returns The productCtx line
   */
  private extractProductCtxLineFromScriptContent(scriptContent: string): string | undefined {
    const lines = scriptContent.split("\n");
    const productCtxLine = lines.find((line: string) => line.includes('"productCtx":'));
    return productCtxLine;
  }

  /**
   * Extracts the diagram display name from the productCtx line
   * @param productCtxLine - The productCtx line
   * @throws An error if the productCtx value is not found
   * @returns The diagram display name
   */
  private extractDiagramDisplayNameFromProductCtxLine(productCtxLine: string): string | undefined {
    const match = productCtxLine.match(/"productCtx"\s*:\s*"(.+?)"\s*,?\s*$/);
    if (!match) {
      throw new Error("Could not extract productCtx value");
    }
    const jsonString = match[1];
    const cleanedJsonString = jsonString.replaceAll("\\", "");
    const json = JSON.parse(cleanedJsonString) as { diagramDisplayName?: string };
    // Either it will return name or undefined
    return json.diagramDisplayName;
  }

  /**
   * Normalizes the file path
   * @param src - The source
   * @returns The normalized file path
   */
  protected normalizeFilePath(src: string): string {
    // Remove URL encoding and construct the full path
    // This should match how paths were stored in phase one
    const decodedSrc = decodeURIComponent(src);
    // Remove all the query params and everything after it
    const withoutQueryParams = decodedSrc.split("?")[0];

    const components = withoutQueryParams.split("/");
    if (components.length > 2) {
      // Split the path by / and take the last two components
      const lastTwoComponents = withoutQueryParams.split("/").slice(-2);
      return lastTwoComponents.join("/");
    }

    return withoutQueryParams;
  }
}
