import crypto from "crypto";
import { parse, HTMLElement } from "node-html-parser";
import { ContentParser, IParserExtension } from "@plane/etl/parser";
import { TZipFileNode, ZipManager } from "@/lib/zip-manager";
import { EZipNodeType } from "@/lib/zip-manager/types";
import { logger } from "@/logger";
import { TDocContentParserConfig } from "../../types";
import { NotionImageParserExtension } from "../common/content-parser";
import {
  NotionBlockColorParserExtension,
  NotionHighlightParserExtension,
} from "../common/content-parser/extensions/process-colors";
import { ProcessLinksExtension } from "../common/content-parser/extensions/process-links";
import { IZipImportDriver } from "../types";
import {
  ConfluenceBackgroundColorParserExtension,
  ConfluenceCalloutParserExtension,
  ConfluenceColorIdParserExtension,
  ConfluenceExtractBodyExtension,
  ConfluenceFileParserExtension,
  ConfluenceIconParserExtension,
  ConfluencePageParserExtension,
  ConfluenceStatusMacroParserExtension,
  ConfluenceTaskListParserExtension,
  PTagCustomComponentExtension,
} from "./content-parser";

/*
 * Confluence zip manager is a custom implementation on top of the existing zip
 * manager which overrides methods of handling file tree and toc, as the zip extracted
 * from confluence is a flat directory structure and in order to fit existing processing
 * logic, it makes an effort to build a file tree from the flat directory structure.
 */
export class ConfluenceImportDriver implements IZipImportDriver {
  constructor(private readonly zipManager: ZipManager) {}

  getContentParser(config: TDocContentParserConfig): ContentParser {
    const context = new Map<string, any>();
    /*
     * In case of confluence, we need to change the asset map and page map
     * as the map given to us by the main worker is aaaa_b/c.ext
     * something but in the source that we get, we get as b/c.ext,
     * just because of that, we need to modify the map, to match
     * the map lookup
     */
    config.assetMap = new Map(
      [...config.assetMap].map(([key, value]) => {
        const components = key.split("_");
        const newKey = components.pop() || "";
        return [newKey, value];
      })
    );
    config.pageMap = new Map(
      [...config.pageMap].map(([key, value]) => {
        const components = key.split("_");
        const newKey = components.pop() || "";
        return [newKey, value];
      })
    );

    const preprocessExtensions: IParserExtension[] = [
      new ConfluenceExtractBodyExtension({ selector: "div#main-content", context }),
      new ConfluenceTaskListParserExtension(),
      new ConfluenceIconParserExtension(),
      new ConfluencePageParserExtension(config),
    ];

    /*----------- Core Extensions -----------*/
    const coreExtensions: IParserExtension[] = [
      new ProcessLinksExtension(),
      new ConfluenceStatusMacroParserExtension(),
      new ConfluenceColorIdParserExtension(context),
      new ConfluenceBackgroundColorParserExtension(),
      new NotionImageParserExtension(config),
      new ConfluenceFileParserExtension({
        ...config,
        context,
      }),
      new NotionBlockColorParserExtension(),
      new NotionHighlightParserExtension(),
    ];

    const postprocessExtensions: IParserExtension[] = [
      new ConfluenceCalloutParserExtension(),
      new PTagCustomComponentExtension(),
    ];

    return new ContentParser(coreExtensions, preprocessExtensions, postprocessExtensions);
  }

  /*
   * Here we override the buildFileTree method to parse the index.html file,
   * which will give us the tree of the files in the zip file ( parent child relationship )
   * We will leverage the same thing in order to create a tree out of that, while
   * keeping the path as the flat structure.
   */
  async buildFileTree(): Promise<TZipFileNode | undefined> {
    const toc = await this.zipManager.getTableOfContents();
    const indexFileContent = await this.getIndexFileContent(toc);
    if (!indexFileContent) {
      return undefined;
    }

    const fileTree = this.parseIndexFileContent(indexFileContent, toc);
    if (!fileTree) {
      return undefined;
    }
    return fileTree;
  }

  /*
   * Gets the content of the index.html file
   * @returns The content of the index.html file
   */
  private async getIndexFileContent(toc: string[]): Promise<undefined | string> {
    const indexFile = toc.find((file) => file.endsWith("index.html"));
    if (!indexFile) {
      logger.warn("Index file not found, skipping file tree build");
      return undefined;
    }
    const content = await this.zipManager.getFileContent(indexFile);
    return content.toString();
  }

  /*
   * Parses the index.html file content and builds the file tree
   * @param indexFileContent - The content of the index.html file
   * @returns The file tree
   */
  private parseIndexFileContent(indexFileContent: string, toc: string[]): TZipFileNode | undefined {
    // Create root node
    const root: TZipFileNode = {
      id: "root",
      name: "root",
      type: EZipNodeType.DIRECTORY,
      path: "",
      children: [],
    };

    // Parse the HTML content
    const doc = parse(indexFileContent);

    // Find the main content div that contains the page list
    const contentDiv = doc.querySelector(".pageSection:not(#main-content)");
    if (!contentDiv) {
      logger.warn("Could not find content div in index.html");
      return undefined;
    }

    // Get the first ul element which contains the main page list
    const mainList = contentDiv.querySelector("ul");
    if (!mainList) {
      logger.warn("Could not find main list in index.html");
      return undefined;
    }

    /*
     * Recursively process the list items and build the file tree
     * We will use the href as the path and the name as the name of the file
     */
    const processListItem = (li: HTMLElement, parentNode: TZipFileNode) => {
      const link = li.querySelector("> a");
      if (!link) return;

      const href = link.getAttribute("href");
      const name = link.textContent?.trim() || "";

      if (!href) return;

      const zipFilePath = this.fileZipFilePath(toc, href);

      // We need to create a node for the file and a node for the directory
      const node: TZipFileNode = {
        id: crypto.randomUUID(),
        name: name,
        type: EZipNodeType.FILE,
        path: zipFilePath,
        children: [],
      };
      const directoryNode = this.getDirectoryNode(node);
      const attachmentNodes = this.getAttachmentNodes(toc, node);

      if (attachmentNodes.length > 0) {
        if (directoryNode.children) {
          directoryNode.children.push(...attachmentNodes);
        } else {
          directoryNode.children = attachmentNodes;
        }
      }

      // Add to parent's children
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(node, directoryNode);

      // Process nested lists (child pages)
      const nestedLists = li.querySelectorAll("> ul");
      if (nestedLists) {
        nestedLists.forEach((item) => {
          const nestedItems = item.querySelectorAll("> li");
          nestedItems.forEach((nestedItem: HTMLElement) => processListItem(nestedItem, directoryNode));
        });
      }
    };

    // Process all top-level list items
    const listItems = mainList.querySelectorAll("> li");
    listItems.forEach((item: HTMLElement) => processListItem(item, root));

    return root;
  }

  /*
   * Gets the file path in the zip file
   * @param filePath - The path of the file to get the path of
   * @returns The path of the file in the zip file
   */
  private fileZipFilePath(toc: string[], filePath: string): string {
    // This is hell expensive, we need to do something about it
    const file = toc.find((file) => file.endsWith(filePath));
    if (!file) {
      throw new Error(`File not found in zip: ${filePath}`);
    }
    return file;
  }

  /*
   * Gets the directory node for the given node
   * @param node - The node to get the directory node for
   * @returns The directory node
   */
  private getDirectoryNode(node: TZipFileNode): TZipFileNode {
    const directoryNode: TZipFileNode = {
      id: crypto.randomUUID(),
      name: node.name.split(".html")[0],
      type: EZipNodeType.DIRECTORY,
      path: node.path.split(".html")[0],
      children: [],
    };

    return directoryNode;
  }

  /*
   * For each node, we need to perform a lookup in the toc to
   * find if it has any attachments.
   */
  private getAttachmentNodes(toc: string[], node: TZipFileNode): TZipFileNode[] {
    const attachmentNodes: TZipFileNode[] = [];
    // Take the last part of the path and remove the .html
    const nodeIdentifierWithoutHtml = node.path.split(".")[0];
    const nodeIdentifier = nodeIdentifierWithoutHtml.split("_").pop();
    if (!nodeIdentifier) {
      return attachmentNodes;
    }
    const attachments = toc.filter((file) => file.includes(`attachments/${nodeIdentifier}`));
    attachments.forEach((attachment) => {
      // We don't want to add directories to the attachment nodes
      if (attachment.endsWith("/")) return;

      const attachmentNode: TZipFileNode = {
        id: crypto.randomUUID(),
        name: attachment.split("/").pop() || attachment,
        type: EZipNodeType.FILE,
        path: attachment,
        children: [],
      };

      attachmentNodes.push(attachmentNode);
    });

    return attachmentNodes;
  }
}
