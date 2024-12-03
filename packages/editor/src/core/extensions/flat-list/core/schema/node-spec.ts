import { type DOMOutputSpec, type NodeSpec } from "@tiptap/pm/model";

import { createParseDomRules } from "./parse-dom";
import { listToDOM } from "./to-dom";

/**
 * The default group name for list nodes. This is used to find the list node
 * type from the schema.
 *
 * @internal Schema
 */
export const flatListGroup = "flatList";

export interface ListSpecOptions {
  content?: string;
  listTypeName?: string;
  group?: string;
}

/**
 * Return the spec for list node.
 *
 *  @public @group Schema
 */
export function createListSpec(options: ListSpecOptions = {}): NodeSpec {
  const { content = "block+", listTypeName = "list", group = `${flatListGroup} block` } = options;

  return {
    // what content could be inside the block
    content,
    // what is the group (an entity specified by which someone could refer
    // to flatLists if they want to allow it in their content) of the current flatList node
    group,
    // AI
    definingForContent: true,
    // when selecting and pasting some content over flat lists, do we need
    // to replace the entire content or not
    definingAsContext: false,
    attrs: {
      kind: {
        default: "bullet",
      },
      order: {
        default: null,
      },
      checked: {
        default: false,
      },
      collapsed: {
        default: false,
      },
    },
    toDOM: (node): DOMOutputSpec => {
      return listToDOM({ node });
    },

    parseDOM: createParseDomRules(listTypeName),
  };
}
