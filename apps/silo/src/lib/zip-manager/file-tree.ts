import crypto from "crypto";
import { EZipNodeType, TZipFileNode } from "./types";

// Build a file tree from a list of file paths
export function buildFileTree(filePaths: string[]): TZipFileNode {
  // Create root node
  const root: TZipFileNode = {
    id: "root",
    name: "root",
    type: EZipNodeType.DIRECTORY,
    path: "",
  };

  // Cache to store nodes by path for faster lookup
  const nodeCache = new Map<string, TZipFileNode>();
  nodeCache.set("", root);

  // Process each file path
  for (const filePath of filePaths) {
    const pathParts = filePath.split("/");
    let currentNode = root;
    let currentPath = "";

    // Build path node by node
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
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
  addMissingHtmlPages(root);

  return root;
}

/**
 * Recursively traverses the tree and adds dummy HTML pages for directories
 * that don't already have a corresponding HTML page
 */
/**
 * Recursively traverses the tree and adds dummy HTML pages for directories
 * that don't already have a corresponding HTML page at the same level
 */
function addMissingHtmlPages(node: TZipFileNode): void {
  if (!node.children || node.children.length === 0) {
    return; // No children, nothing to process
  }

  // Recursively process all children first
  for (const child of node.children) {
    addMissingHtmlPages(child);
  }

  // Now check for missing HTML pages for directories at this level
  const directories = node.children.filter(child => child.type === EZipNodeType.DIRECTORY);
  const htmlFiles = new Set(
    node.children
      .filter(child => child.type === EZipNodeType.FILE && child.name.endsWith('.html'))
      .map(child => child.name.replace(/\.html$/, ''))
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
      };

      // Add the dummy page as a sibling (to the same parent)
      node.children.push(dummyPage);
    }
  }
}

// Helper function to identify attachment files
export function isAttachmentFile(path: string): boolean {
  const extensions = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".svg", ".mp4", ".mp3"];
  return extensions.some((ext) => path.toLowerCase().endsWith(ext));
}
