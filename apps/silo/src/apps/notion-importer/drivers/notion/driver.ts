import { ContentParser, IParserExtension, PTagCustomComponentExtension } from "@plane/etl/parser";
import { EZipNodeType, TZipFileNode } from "@/lib/zip-manager/types";
import { ZipManager } from "@/lib/zip-manager/zip-manager";
import { TDocContentParserConfig } from "../../types";
import { ExtractBodyExtension } from "../common/content-parser/extensions/extract-body";
import { CalloutParserExtension } from "../common/content-parser/extensions/process-callouts";
import {
  NotionBlockColorParserExtension,
  NotionHighlightParserExtension,
} from "../common/content-parser/extensions/process-colors";
import { NotionFileParserExtension } from "../common/content-parser/extensions/process-files";
import { NotionImageParserExtension } from "../common/content-parser/extensions/process-images";
import { ProcessLinksExtension } from "../common/content-parser/extensions/process-links";
import { NotionPageParserExtension } from "../common/content-parser/extensions/process-page";
import { IZipImportDriver } from "../types";

export class NotionImportDriver implements IZipImportDriver {
  constructor(private readonly zipManager: ZipManager) {}

  getContentParser(config: TDocContentParserConfig): ContentParser {
    const context = new Map<string, string>();
    const preprocessExtensions: IParserExtension[] = [
      new CalloutParserExtension(),
      new ExtractBodyExtension({ selector: "div.page-body", context }),
    ];

    /*----------- Core Extensions -----------*/
    const coreExtensions: IParserExtension[] = [
      new ProcessLinksExtension(),
      new NotionImageParserExtension(config),
      new NotionFileParserExtension(config),
      new NotionPageParserExtension(config),
      new NotionBlockColorParserExtension(),
      new NotionHighlightParserExtension(),
      new PTagCustomComponentExtension(),
    ];

    return new ContentParser(coreExtensions, preprocessExtensions, []);
  }

  async buildFileTree(): Promise<TZipFileNode> {
    const toc = await this.zipManager.getTableOfContents();
    // Create root node
    const root: TZipFileNode = {
      id: "root",
      name: "root",
      type: EZipNodeType.DIRECTORY,
      path: "",
      depth: 0,
    };

    // Cache to store nodes by path for faster lookup
    const nodeCache = new Map<string, TZipFileNode>();
    nodeCache.set("", root);

    // Process each file path
    for (const filePath of toc) {
      const pathParts = filePath.split("/");
      let currentNode = root;
      let currentPath = "";

      // Build path node by node
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];

        if (part === "") {
          continue;
        }

        const isFile = i === pathParts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        // Check if this node already exists in cache
        let childNode = nodeCache.get(currentPath);

        if (!childNode) {
          // Create new node
          childNode = {
            id: crypto.randomUUID(),
            name: part,
            type: isFile ? EZipNodeType.FILE : EZipNodeType.DIRECTORY,
            path: currentPath,
            depth: i,
          };

          // Add to parent's children
          if (!currentNode.children) {
            currentNode.children = [];
          }
          currentNode.children.push(childNode);
          nodeCache.set(currentPath, childNode);
        }

        // Move to next node
        currentNode = childNode;
      }
    }

    /*
     * For each directory, we need a corresponding html page, else we'll break the constraint
     * and won't be able to parse, as for anything to exist we need a page for it.
     */
    this.addMissingHtmlPages(root);
    return root;
  }

  /*
   * Adds missing HTML pages to the file tree
   * @param node - The node to add missing HTML pages to
   */
  private addMissingHtmlPages(node: TZipFileNode): void {
    if (!node.children || node.children.length === 0) {
      return; // No children, nothing to process
    }

    // Recursively process all children first
    for (const child of node.children) {
      this.addMissingHtmlPages(child);
    }

    // Now check for missing HTML pages for directories at this level
    const directories = node.children.filter((child) => child.type === EZipNodeType.DIRECTORY);
    const htmlFiles = new Set(
      node.children
        .filter((child) => child.type === EZipNodeType.FILE && child.name.endsWith(".html"))
        .map((child) => child.name.replace(/\.html$/, ""))
    );

    // For each directory, check if there's a corresponding HTML file at the same level
    for (const directory of directories) {
      const hasCorrespondingHtmlPage = htmlFiles.has(directory.name);
      if (!hasCorrespondingHtmlPage) {
        // Create dummy HTML page as a sibling to this directory
        const dummyPage: TZipFileNode = {
          id: crypto.randomUUID(),
          name: `${directory.name}.html`,
          type: EZipNodeType.FILE,
          path: `${directory.path}.html`,
          depth: directory.depth,
        };

        // Add the dummy page as a sibling (to the same parent)
        node.children.push(dummyPage);
      }
    }
  }
}
