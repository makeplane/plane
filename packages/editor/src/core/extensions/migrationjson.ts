import type { ListAttributes, ListKind, ProsemirrorNodeJSON } from "./types";

function migrateNodes(nodes: ProsemirrorNodeJSON[]): [ProsemirrorNodeJSON[], boolean] {
  const content: ProsemirrorNodeJSON[] = [];
  let updated = false;

  for (const node of nodes) {
    if (node.type === "bullet_list" || node.type === "bulletList") {
      updated = true;
      for (const child of node.content ?? []) {
        const [migratedChild, childUpdated] = migrateNode(child, {
          kind: "bullet",
        });
        content.push(migratedChild);
        updated = updated || childUpdated;
      }
    } else if (node.type === "ordered_list" || node.type === "orderedList") {
      updated = true;
      for (const child of node.content ?? []) {
        const [migratedChild, childUpdated] = migrateNode(child, {
          kind: "ordered",
        });
        content.push(migratedChild);
        updated = updated || childUpdated;
      }
    } else if (node.type === "task_list" || node.type === "taskList") {
      updated = true;
      for (const child of node.content ?? []) {
        const [migratedChild, childUpdated] = migrateNode(child, {
          kind: "task",
        });
        content.push(migratedChild);
        updated = updated || childUpdated;
      }
    } else {
      // Handle other node types, including those that may contain list items
      const [migratedContent, contentUpdated] = migrateNodes(node.content ?? []);
      content.push({ ...node, content: migratedContent });
      updated = updated || contentUpdated;
    }
  }

  return [content, updated];
}

function migrateNode(node: ProsemirrorNodeJSON, { kind }: { kind?: ListKind } = {}): [ProsemirrorNodeJSON, boolean] {
  // Check if the node is a list item
  if (node.type === "list_item" || node.type === "listItem" || node.type === "taskListItem") {
    const [content, updated] = migrateNodes(node.content ?? []);
    return [
      {
        ...node,
        type: "list",
        attrs: {
          collapsed: Boolean(node.attrs?.closed),
          ...node.attrs,
          kind: kind ?? "bullet",
        } satisfies ListAttributes,
        content,
      },
      true,
    ];
  } else if (node.content) {
    // If the node has content, we need to check for nested list items
    const [content, updated] = migrateNodes(node.content);
    return [{ ...node, content }, updated];
  } else {
    return [node, false];
  }
}

/**
 * Migrate a ProseMirror document JSON object from the old list structure to the
 * new. A new document JSON object is returned if the document is updated,
 * otherwise `null` is returned.
 *
 * @public
 */
export function migrateDocJSON(docJSON: ProsemirrorNodeJSON): ProsemirrorNodeJSON | null {
  const [migrated, updated] = migrateNode(docJSON);
  return updated ? migrated : null;
}
