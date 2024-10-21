import { Node, NodeRange } from "@tiptap/core";
import {
  createListSpec,
  createListPlugins,
  listInputRules,
  listKeymap,
  DedentListOptions,
  IndentListOptions,
  ListAttributes,
  ToggleCollapsedOptions,
  UnwrapListOptions,
  createDedentListCommand,
  createIndentListCommand,
  createMoveListCommand,
  createSplitListCommand,
  createToggleCollapsedCommand,
  createToggleListCommand,
  createUnwrapListCommand,
  createWrapInListCommand,
  protectCollapsed,
} from "prosemirror-flat-list";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    flatListComponent: {
      toggleCustomList: (attrs: Record<string, any>) => ReturnType;
    };
  }
}

const listSpec = createListSpec();
export const FlatListExtension = Node.create({
  name: "flatListComponent",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return listSpec.attrs;
  },

  parseHTML() {
    return listSpec.parseDOM;
  },

  renderHTML({ node }) {
    return listSpec.toDOM(node);
  },

  // addCommands() {
  //   return {
  //     toggleCustomList:
  //       (attrs) =>
  //       ({ commands }) =>
  //         commands.toggleNode(this.name, this.name, attrs),
  //   };
  // },

  addCommands() {
    return {
      indentList: (props?: IndentListOptions) => createIndentListCommand(props),
      dedentList: (props?: DedentListOptions) => createDedentListCommand(props),
      unwrapList: (options?: UnwrapListOptions) => createUnwrapListCommand(options),
      wrapInList: (getAttrs: ListAttributes | ((range: NodeRange) => ListAttributes | null)) =>
        createWrapInListCommand<ListAttributes>(getAttrs),
      moveList: (direction: "up" | "down") => createMoveListCommand(direction),
      splitList: () => createSplitListCommand(),

      protectCollapsed: () => protectCollapsed,

      toggleCollapsed: (props?: ToggleCollapsedOptions) => createToggleCollapsedCommand(props),
      toggleList: (attrs: ListAttributes) => createToggleListCommand(attrs),
    } as const;
  },

  addInputRules() {
    return listInputRules;
  },

  addProseMirrorPlugins() {
    return [...createListPlugins({ schema: this.editor.schema }), listInputRules, listKeymap];
  },
});
