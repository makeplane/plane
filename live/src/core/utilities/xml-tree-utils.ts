import * as Y from "yjs";

/**
 * Recursively finds all XML elements in the tree that match the given criteria
 *
 * @param node The root node to start searching from (Y.XmlFragment or Y.XmlElement)
 * @param nodeName The node name to match (e.g. "pageEmbedComponent")
 * @param attributeName The attribute name to match
 * @param attributeValue The attribute value to match or "*" for any value
 * @returns An array of objects containing the matched node and its path information
 */
export function findAllElementsRecursive(
  node: Y.XmlFragment | Y.XmlElement,
  nodeName: string,
  attributeName: string,
  attributeValue: string,
  path: string[] = []
): Array<{
  node: Y.XmlElement;
  parent: Y.XmlFragment | Y.XmlElement;
  indexInParent: number;
  path: string[];
}> {
  const results: Array<{
    node: Y.XmlElement;
    parent: Y.XmlFragment | Y.XmlElement;
    indexInParent: number;
    path: string[];
  }> = [];

  const children = node.toArray();

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (child instanceof Y.XmlElement) {
      // Calculate the path to this node
      const nodePath = [...path];
      if (child.nodeName) {
        nodePath.push(`${child.nodeName}[${i}]`);
      }

      // Check if the current element matches the criteria
      if (child.nodeName === nodeName) {
        const attrValue = child.getAttribute(attributeName);
        // Match if the attribute value is the wildcard "*" or if it matches exactly
        if (attributeValue === "*" || attrValue === attributeValue) {
          results.push({
            node: child,
            parent: node,
            indexInParent: i,
            path: nodePath,
          });
        }
      }

      // Recursively search in this element's children
      const nestedResults = findAllElementsRecursive(child, nodeName, attributeName, attributeValue, nodePath);

      results.push(...nestedResults);
    }
  }

  return results;
}

/**
 * Get a string representation of the path to a node for logging purposes
 *
 * @param pathArray The path array from findAllElementsRecursive
 * @returns A string representation of the path
 */
export function getPathString(pathArray: string[]): string {
  if (pathArray.length === 0) {
    return "root";
  }
  return pathArray.join(" > ");
}

/**
 * Insert a new node after a specific target node in the XML tree
 *
 * @param parent The parent node containing the target node
 * @param targetIndex The index of the target node in the parent
 * @param newNode The new node to insert
 */
export function insertNodeAfter(
  parent: Y.XmlFragment | Y.XmlElement,
  targetIndex: number,
  newNode: Y.XmlElement
): void {
  parent.insert(targetIndex + 1, [newNode]);
}

/**
 * Replace a node in the XML tree with a new node
 *
 * @param parent The parent node containing the target node
 * @param targetIndex The index of the target node in the parent
 * @param newNode The new node to replace the target node with
 */
export function replaceNode(parent: Y.XmlFragment | Y.XmlElement, targetIndex: number, newNode: Y.XmlElement): void {
  parent.delete(targetIndex, 1);
  parent.insert(targetIndex, [newNode]);
}

/**
 * Delete a node from the XML tree
 *
 * @param parent The parent node containing the target node
 * @param targetIndex The index of the target node in the parent
 */
export function deleteNode(parent: Y.XmlFragment | Y.XmlElement, targetIndex: number): void {
  parent.delete(targetIndex, 1);
}

