/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { getNodeAtPosition } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { CORE_EXTENSIONS, ADDITIONAL_EXTENSIONS } from "@plane/utils";
// constants
import { CORE_EDITOR_META } from "@/constants/meta";
// extensions
import { ECustomImageAttributeNames, ECustomImageStatus } from "@/extensions/custom-image/types";
import type { TMentionComponentAttributes } from "@/extensions/mentions/types";
// types
import type { IEditorPropsExtended } from "@/types";

export type TSelectionConversionItem = {
  node: ProseMirrorNode;
  title: string;
  children: TSelectionConversionItem[];
  pos: number;
  description_html?: string;
  range?: [from: number, to: number]; // [start, end] positions for replacement
  hasSubList?: boolean;
  isInline?: boolean; // For mixed content - indicates inline vs block selection
  preservedComponents?: ProseMirrorNode[]; // Preserved component nodes (embeds, attachments, etc.) to insert after mention
};

export type TSelectedListItemsResult = {
  items: TSelectionConversionItem[];
  totalCount: number;
};

const LIST_ITEM_TYPES = [CORE_EXTENSIONS.LIST_ITEM, CORE_EXTENSIONS.TASK_ITEM];
const LIST_TYPES = [CORE_EXTENSIONS.ORDERED_LIST, CORE_EXTENSIONS.BULLET_LIST, CORE_EXTENSIONS.TASK_LIST];

/**
 * Node types that should be preserved during selection conversion
 * These components will not be converted to description HTML but will be inserted after the mention as they are not supported in work item descriptions
 */
const PRESERVED_COMPONENT_TYPES = [
  ADDITIONAL_EXTENSIONS.PAGE_EMBED_COMPONENT,
  ADDITIONAL_EXTENSIONS.DRAWIO,
  CORE_EXTENSIONS.WORK_ITEM_EMBED,
];

const shouldPreserveNode = (nodeTypeName: string): boolean =>
  PRESERVED_COMPONENT_TYPES.includes(nodeTypeName as ADDITIONAL_EXTENSIONS | CORE_EXTENSIONS);

// Helper function to update image component status in HTML to "duplicating"
const updateImageStatusInHTML = (html: string): string => {
  if (!html) return html;

  // Create a temporary DOM element to parse and manipulate HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Find all image-component elements and update their status
  const imageComponents = tempDiv.querySelectorAll("image-component");
  imageComponents.forEach((img) => {
    img.setAttribute(ECustomImageAttributeNames.STATUS, ECustomImageStatus.DUPLICATING);
  });

  return tempDiv.innerHTML;
};

export const getSelectedListItems = (editor: Editor): TSelectedListItemsResult => {
  const { doc, selection } = editor.state;
  const { from, to } = selection;

  // Early return if selection doesn't have any text content
  const slice = selection.content();
  const hasTextContent = slice.content.textBetween(0, slice.content.size, "\n", "\0").trim().length > 0;
  if (!hasTextContent) {
    return { items: [], totalCount: 0 };
  }

  // Check for both regular list items and task items
  const [startListItem] = getNodeAtPosition(editor.state, CORE_EXTENSIONS.LIST_ITEM, from);
  const [endListItem] = getNodeAtPosition(editor.state, CORE_EXTENSIONS.LIST_ITEM, to);
  const [startTaskItem] = getNodeAtPosition(editor.state, CORE_EXTENSIONS.TASK_ITEM, from);
  const [endTaskItem] = getNodeAtPosition(editor.state, CORE_EXTENSIONS.TASK_ITEM, to);

  // Determine if we have only list items or mixed content
  let hasOnlyListItems = true;
  let hasListItems = false;

  // If selection starts or ends in a list item or task item, check all nodes in between
  if (startListItem || endListItem || startTaskItem || endTaskItem) {
    hasListItems = true;

    doc.nodesBetween(from, to, (node, pos) => {
      if (node.isBlock && pos >= from && pos + node.nodeSize <= to) {
        const isListItem = LIST_ITEM_TYPES.includes(node.type.name as CORE_EXTENSIONS);
        const isList = LIST_TYPES.includes(node.type.name as CORE_EXTENSIONS);
        // Check if this block is inside a list item or task item (works for any element type)
        const isInsideListItem =
          getNodeAtPosition(editor.state, CORE_EXTENSIONS.LIST_ITEM, pos)[0] !== null ||
          getNodeAtPosition(editor.state, CORE_EXTENSIONS.TASK_ITEM, pos)[0] !== null;

        if (!isListItem && !isList && !isInsideListItem) {
          // Found a block that's not part of a list structure
          hasOnlyListItems = false;
        }
      }
    });
  } else {
    // No list items in selection at all
    hasOnlyListItems = false;
  }

  // Case 1: Selection contains ONLY list items - process as nested work items
  if (hasOnlyListItems && hasListItems) {
    // Track total count as we process items
    let totalCount = 0;

    // Helper function to recursively process list items (matches production Ln function)
    const processListItem = (
      node: ProseMirrorNode,
      pos: number,
      selectionFrom: number,
      selectionTo: number
    ): TSelectionConversionItem | null => {
      // Handle both regular list items and task items
      if (!LIST_ITEM_TYPES.includes(node.type.name as CORE_EXTENSIONS)) return null;

      const children: TSelectionConversionItem[] = [];

      // Check if list item has more than just a paragraph (has nested lists or multiple content nodes)
      const hasMultipleContentNodes = node.childCount > 1;
      let hasSubList = false;
      let description_html = "<p></p>";
      const preservedComponents: ProseMirrorNode[] = [];

      // Collect all non-list children for description and extract preserved components
      const contentNodes: ProseMirrorNode[] = [];
      node.content.forEach((child) => {
        if (LIST_TYPES.includes(child.type.name as CORE_EXTENSIONS)) {
          hasSubList = true;
        } else if (shouldPreserveNode(child.type.name)) {
          // Extract preserved component nodes (page embeds, attachments, etc.)
          preservedComponents.push(child);
        } else {
          contentNodes.push(child);
        }
      });

      // Find the first non-empty text content from any content node for the title
      let fullText = "";
      for (const contentNode of contentNodes) {
        const text = contentNode.textContent.trim();
        if (text) {
          fullText = text;
          break;
        }
      }

      // If no text content found in any content nodes, skip this item
      if (!fullText) return null;
      // Trim title to 255 chars
      const title = fullText.slice(0, 255);

      // Generate description HTML
      if (fullText.length > 255 || (hasMultipleContentNodes && contentNodes.length > 1)) {
        // Serialize all non-list content to HTML
        const tempDiv = document.createElement("div");
        const domSerializer = DOMSerializer.fromSchema(editor.state.schema);

        try {
          contentNodes.forEach((contentNode) => {
            const dom = domSerializer.serializeNode(contentNode);
            tempDiv.appendChild(dom);
          });
          // Update image component status in the serialized HTML
          description_html = updateImageStatusInHTML(tempDiv.innerHTML);
        } catch (error) {
          console.error("Failed to serialize list item content:", error);
          // Fallback to text in paragraph
          description_html = `<p>${fullText}</p>`;
        }
      }

      // Calculate range to replace ALL content nodes and preserved components, but preserve nested lists
      // We need to sum up the sizes of all contentNodes and preservedComponents
      const contentNodesSize = contentNodes.reduce((sum, node) => sum + node.nodeSize, 0);
      const preservedComponentsSize = preservedComponents.reduce((sum, node) => sum + node.nodeSize, 0);
      const totalContentSize = contentNodesSize + preservedComponentsSize;

      const rangeStart = pos + 1; // Start after list item opening
      const rangeEnd = rangeStart + totalContentSize;

      // If has sublist: Replace all content nodes as complete nodes, preserving the sublist that comes after
      // If no sublist: Replace all content nodes as complete nodes (there's nothing to preserve after)
      // In both cases, we replace the complete nodes [rangeStart, rangeEnd]
      const range: [from: number, to: number] = [rangeStart, rangeEnd];

      // Process nested list items ONLY if they are within the selection
      let currentPos = pos + 1; // Start after list item opening
      node.content.forEach((child) => {
        if (LIST_TYPES.includes(child.type.name as CORE_EXTENSIONS)) {
          // currentPos is now at the start of the nested list
          const nestedListPos = currentPos;

          // Process each item in the nested list
          let nestedItemPos = nestedListPos + 1; // +1 for list container opening
          child.content.forEach((nestedListItem) => {
            const nestedItemEnd = nestedItemPos + nestedListItem.nodeSize;

            // Only process if this nested item is within the selection range
            if (nestedItemPos < selectionTo && nestedItemEnd > selectionFrom) {
              const processed = processListItem(nestedListItem, nestedItemPos, selectionFrom, selectionTo);
              if (processed) {
                children.push(processed);
              }
            }
            nestedItemPos += nestedListItem.nodeSize;
          });
        }
        currentPos += child.nodeSize;
      });

      // Increment count for this item (children are already counted recursively)
      totalCount++;

      return {
        node,
        title,
        children,
        pos,
        range,
        hasSubList,
        description_html,
        preservedComponents: preservedComponents.length > 0 ? preservedComponents : undefined,
      };
    };

    const items: TSelectionConversionItem[] = [];
    const processedPositions = new Set<number>();

    // Find all top-level list items in the selection
    // We only want list items that are directly in the selection, not all descendants
    doc.nodesBetween(from, to, (node, pos) => {
      if (LIST_ITEM_TYPES.includes(node.type.name as CORE_EXTENSIONS)) {
        // Check if this list item's paragraph (first child) intersects with selection
        const paragraphPos = pos + 1;
        const paragraphEnd = pos + 1 + (node.child(0)?.nodeSize || 0);

        // Only include this item if its text content is within selection
        if (paragraphPos < to && paragraphEnd > from && !processedPositions.has(pos)) {
          // Check if this is a top-level item (not nested in our result set)
          const isTopLevel = !items.some((item) => pos > item.pos && pos < item.pos + item.node.nodeSize);

          if (isTopLevel) {
            const processed = processListItem(node, pos, from, to);
            if (processed) {
              items.push(processed);
              processedPositions.add(pos);
            }
          }
        }
      }
    });

    return {
      items,
      totalCount,
    };
  }

  // Case 2: Selection contains mixed content (not just lists) - create single work item
  // Check if selection is inline (within same parent)
  const isInlineSelection = selection.$from.parent === selection.$to.parent;

  // Serialize the selection to HTML
  const tempDiv = document.createElement("div");
  let descriptionHTML = "";
  let firstChildText = "";
  const preservedComponents: ProseMirrorNode[] = [];

  try {
    const slice = selection.content();
    const fragment = slice.content;

    // Use DOM serialization to convert selection to HTML
    const domSerializer = DOMSerializer.fromSchema(editor.view.state.schema);

    fragment.forEach((node) => {
      // Check if this node should be preserved (page embeds, attachments, etc.)
      if (shouldPreserveNode(node.type.name)) {
        preservedComponents.push(node);
        // Don't serialize preserved components to description
        return;
      }

      const dom = domSerializer.serializeNode(node);
      tempDiv.appendChild(dom);
      // Get text from the first node with actual content for the title
      if (!firstChildText) {
        const text = node.textContent.trim();
        if (text) {
          firstChildText = text;
        }
      }
    });

    // Update image component status in the serialized HTML
    descriptionHTML = updateImageStatusInHTML(tempDiv.innerHTML);
  } catch (error) {
    console.error("Failed to serialize selection:", error);
    descriptionHTML = "<p></p>";
  }

  // Get first 255 characters from the first non-empty text content
  const title = firstChildText.slice(0, 255).trim();

  // If no title found (all empty paragraphs or only preserved components), return empty
  if (!title) {
    return {
      items: [],
      totalCount: 0,
    };
  }

  const mixedContentItems = [
    {
      node: selection.$from.parent,
      title,
      children: [],
      pos: from,
      description_html: descriptionHTML,
      isInline: isInlineSelection,
      preservedComponents: preservedComponents.length > 0 ? preservedComponents : undefined,
    },
  ];

  return {
    items: mixedContentItems,
    totalCount: 1, // Mixed content always creates a single work item
  };
};

export type THandleSelectionConversionArgs = {
  editor: Editor;
  items: TSelectionConversionItem[];
  projectId?: string;
  totalCount: number;
} & Pick<IEditorPropsExtended, "selectionConversion">;

export const handleSelectionConversion = async (args: THandleSelectionConversionArgs): Promise<void> => {
  const { editor, items, projectId, selectionConversion, totalCount } = args;
  // Array to collect all work items with their metadata for later insertion
  const workItemsToInsert: Array<{
    range: [from: number, to: number];
    workItemId: string;
    preservedComponents?: ProseMirrorNode[];
  }> = [];

  // Track if this is mixed content (single item with description_html but no range)
  let isMixedContent = false;
  let mixedContentWorkItemId: string | null = null;
  let mixedContentIsInline = false;
  let mixedContentPreservedComponents: ProseMirrorNode[] = [];

  // Track errors to throw at the end
  const errors: Error[] = [];

  // Recursively create work items from top to bottom and collect them
  const createWorkItemAndSubWorkItems = async (item: TSelectionConversionItem, parentId?: string) => {
    try {
      const workItem = await selectionConversion?.createWorkItemCallback?.(
        {
          name: item.title,
          description_html: item.description_html || "<p></p>",
          ...(parentId ? { parent_id: parentId } : {}),
        },
        projectId
      );
      if (!workItem) {
        const error = new Error(`Work item creation returned null/undefined for: ${item.title}`);
        console.error(error.message);
        errors.push(error);
        return;
      }

      // Collect work item for later insertion
      if (item.range) {
        // List items with explicit ranges
        workItemsToInsert.push({
          range: item.range,
          workItemId: workItem.id,
          preservedComponents: item.preservedComponents,
        });
      } else if (item.description_html && !parentId) {
        // Mixed content (no range, has description_html, top-level only)
        isMixedContent = true;
        mixedContentWorkItemId = workItem.id;
        mixedContentIsInline = item.isInline || false;
        mixedContentPreservedComponents = item.preservedComponents || [];
      }

      // Recursively create children in parallel
      await Promise.all(item.children.map((child) => createWorkItemAndSubWorkItems(child, workItem.id)));
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      console.error("Failed to create work item:", item.title, errorObj);
      errors.push(errorObj);
      // Continue with next item even if this one fails
    }
  };

  const createTree = async () => {
    // Create all root-level work items in parallel
    await Promise.all(items.map((item) => createWorkItemAndSubWorkItems(item)));
  };
  const createTreePromise = createTree();
  setPromiseToast(createTreePromise, {
    loading: `Creating work item${totalCount > 1 ? "s" : ""}`,
    success: {
      title: "Successful!",
      message: () => `Work item${totalCount > 1 ? "s" : ""} created.`,
    },
    error: {
      title: "Error!",
      message: () => `Failed to create work item${totalCount > 1 ? "s" : ""}.`,
    },
  });
  await createTreePromise;

  // Show error/warning toast if there were any failures
  if (errors.length > 0) {
    const successCount = workItemsToInsert.length || (mixedContentWorkItemId ? 1 : 0);
    const failureCount = errors.length;

    if (successCount > 0) {
      // Partial success - show warning
      setToast({
        type: TOAST_TYPE.WARNING,
        title: "Partial success!",
        message: `${successCount} work item${successCount > 1 ? "s" : ""} created, ${failureCount} failed.`,
      });
    } else {
      // Complete failure - show error
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: `Failed to create ${failureCount} work item${failureCount > 1 ? "s" : ""}.`,
      });
    }
  }

  // Handle mixed content separately
  if (isMixedContent && mixedContentWorkItemId) {
    // Cast to extended editor ref to access extended functions
    replaceSelectionWithMention({
      editor,
      attrs: {
        entity_identifier: mixedContentWorkItemId,
        entity_name: "issue_mention",
        id: uuidv4(),
      },
      isInline: mixedContentIsInline,
      preservedComponents: mixedContentPreservedComponents,
    });
    return;
  }

  // Sort by range start position in descending order (highest position first)
  // This ensures we insert from bottom to top to avoid position shifts
  workItemsToInsert.sort((a, b) => b.range[0] - a.range[0]);

  for (const { range, workItemId, preservedComponents } of workItemsToInsert) {
    replaceRangeWithMention({
      editor,
      attrs: {
        entity_identifier: workItemId,
        entity_name: "issue_mention",
        id: uuidv4(),
      },
      from: range[0],
      to: range[1],
      preservedComponents,
    });
  }
};

type TReplaceRangeWithMentionArgs = {
  editor: Editor;
  attrs: TMentionComponentAttributes;
  from: number;
  to: number;
  preservedComponents?: ProseMirrorNode[];
};

const replaceRangeWithMention = (args: TReplaceRangeWithMentionArgs) => {
  const { editor, attrs, from, to, preservedComponents = [] } = args;

  try {
    const mentionType = editor.state.schema.nodes[CORE_EXTENSIONS.MENTION];
    const paragraphType = editor.state.schema.nodes[CORE_EXTENSIONS.PARAGRAPH];

    if (!mentionType) {
      console.error("Mention node type not found in schema");
      return;
    }

    // Always wrap mention in paragraph for list items since we're replacing complete paragraph nodes
    // This maintains the proper list item structure (list items require at least one paragraph)
    const mentionNode = paragraphType.create(undefined, mentionType.create(attrs));

    // Replace the range with the mention
    const tr = editor.state.tr;
    tr.replaceRangeWith(from, to, mentionNode);

    // Insert preserved components(nodes that are not supported in work item descriptions) after the mention
    if (preservedComponents.length > 0) {
      let insertPosition = from + mentionNode.nodeSize;
      preservedComponents.forEach((componentNode) => {
        tr.insert(insertPosition, componentNode);
        insertPosition += componentNode.nodeSize;
      });
    }

    // Set intentional deletion meta to prevent page embeds from being deleted
    tr.setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true);
    editor.view.dispatch(tr);
  } catch (error) {
    console.error("Error in replaceRangeWithMention:", error);
  }
};

type TReplaceSelectionWithMentionArgs = {
  editor: Editor;
  attrs: TMentionComponentAttributes;
  isInline: boolean;
  preservedComponents?: ProseMirrorNode[];
};

const replaceSelectionWithMention = (args: TReplaceSelectionWithMentionArgs) => {
  const { editor, attrs, isInline, preservedComponents = [] } = args;

  try {
    const { state } = editor;
    const { from, to } = state.selection;

    const mentionType = state.schema.nodes[CORE_EXTENSIONS.MENTION];
    const paragraphType = state.schema.nodes[CORE_EXTENSIONS.PARAGRAPH];

    if (!mentionType) {
      console.error("Mention node type not found in schema");
      return;
    }

    // Create mention node
    const mentionNode = mentionType.create(attrs);

    const tr = state.tr;
    let insertPosition: number;

    if (isInline) {
      // For inline selections (mid-word, within paragraph), replace the range with the mention node
      tr.replaceRangeWith(from, to, mentionNode);
      insertPosition = from + mentionNode.nodeSize;
      // Position cursor after the mention and preserved components
      tr.setSelection(Selection.near(tr.doc.resolve(insertPosition)));
    } else {
      // For block-level selections, wrap in paragraph and replace the range with the paragraph node
      const paragraphNode = paragraphType.create(undefined, mentionNode);
      tr.replaceRangeWith(from, to, paragraphNode);
      insertPosition = from + paragraphNode.nodeSize;
      // Position cursor after the paragraph
      tr.setSelection(Selection.near(tr.doc.resolve(insertPosition)));
    }

    // Insert preserved components(nodes that are not supported in work item descriptions) after the mention
    if (preservedComponents.length > 0) {
      preservedComponents.forEach((componentNode) => {
        tr.insert(insertPosition, componentNode);
        insertPosition += componentNode.nodeSize;
      });
      // Update cursor position to be after all inserted components
      tr.setSelection(Selection.near(tr.doc.resolve(insertPosition)));
    }

    // Set intentional deletion meta to prevent page embeds from being deleted
    tr.setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true);
    editor.view.dispatch(tr);
  } catch (error) {
    console.error("Error in replaceSelectionWithMention:", error);
  }
};
