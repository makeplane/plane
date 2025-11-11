import { type HocuspocusProvider } from "@hocuspocus/provider";
import { Extension, findChildren } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { v4 as uuidv4 } from "uuid";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// plane imports
import { BLOCK_NODE_TYPES } from "@/plane-editor/constants/extensions";
// plugins
import { createUniqueIDPlugin } from "./plugin";

export type UniqueIDGenerationContext = {
  node: ProseMirrorNode;
  pos: number;
};

export interface UniqueIDOptions {
  /**
   * The name of the attribute to add the unique ID to.
   * @default "id"
   */
  attributeName: string;
  /**
   * The types of nodes to add unique IDs to.
   * @default []
   */
  types: string[];
  /**
   * The function that generates the unique ID. By default, a UUID v4 is
   * generated. However, you can provide your own function to generate the
   * unique ID based on the node type and the position.
   */
  generateID: (ctx: UniqueIDGenerationContext) => string;
  /**
   * Ignore some mutations, for example applied from other users through the collaboration plugin.
   *
   * @default null
   */
  filterTransaction: ((transaction: Transaction) => boolean) | null;
  /**
   * Whether to update the document by adding unique IDs to the nodes. Set this
   * property to `false` if the document is in `readonly` mode, is immutable, or
   * you don't want it to be modified.
   *
   * @default true
   */
  updateDocument: boolean;
  /**
   * The provider to use for the unique ID generation.
   * @default null
   */
  provider: HocuspocusProvider | undefined;
}

export const UniqueID = Extension.create<UniqueIDOptions>({
  name: CORE_EXTENSIONS.UNIQUE_ID,

  // we’ll set a very high priority to make sure this runs first
  // and is compatible with `appendTransaction` hooks of other extensions
  priority: 10000,

  addOptions() {
    return {
      attributeName: "id",
      types: BLOCK_NODE_TYPES,
      generateID: () => uuidv4(),
      filterTransaction: null,
      updateDocument: true,
      provider: undefined,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          [this.options.attributeName]: {
            default: null,
            parseHTML: (element) => element.getAttribute(`data-${this.options.attributeName}`),
            renderHTML: (attributes) => {
              if (!attributes[this.options.attributeName]) {
                return {};
              }

              return {
                [`data-${this.options.attributeName}`]: attributes[this.options.attributeName],
              };
            },
          },
        },
      },
    ];
  },

  // check initial content for missing ids
  onCreate() {
    if (!this.editor.isEditable) {
      this.options.updateDocument = false;
    }

    if (!this.options.updateDocument) {
      return;
    }

    const provider = this.options.provider;

    const createIds = () => {
      const { view, state } = this.editor;
      const { tr, doc } = state;
      const { types, attributeName, generateID } = this.options;
      const nodesWithoutId = findChildren(
        doc,
        (node) => types.includes(node.type.name) && node.attrs[attributeName] === null
      );

      nodesWithoutId.forEach(({ node, pos }) => {
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          [attributeName]: generateID({ node, pos }),
        });
      });

      tr.setMeta("addToHistory", false);

      view.dispatch(tr);

      if (provider) {
        provider.off("synced", createIds);
      }
    };

    /**
     * We need to handle collaboration a bit different here
     * because we can't automatically add IDs when the provider is not yet synced
     * otherwise we end up with empty paragraphs
     */
    if (provider) {
      provider.on("synced", createIds);
    } else {
      return createIds();
    }
  },

  addProseMirrorPlugins() {
    if (!this.options.updateDocument) {
      return [];
    }

    return [createUniqueIDPlugin(this.options)];
  },
});
