import { TextSelection } from "prosemirror-state";

import { InputRule, mergeAttributes, Node, nodeInputRule, wrappingInputRule } from "@tiptap/core";

/**
 * Extension based on:
 * - Tiptap HorizontalRule extension (https://tiptap.dev/api/nodes/horizontal-rule)
 */

export interface HorizontalRuleOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    horizontalRule: {
      /**
       * Add a horizontal rule
       */
      setHorizontalRule: () => ReturnType;
    };
  }
}

export default Node.create<HorizontalRuleOptions>({
  name: "horizontalRule",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: "block",

  addAttributes() {
    return {
      color: {
        default: "#dddddd",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": this.name,
      }),
      ["div", {}],
    ];
  },

  addCommands() {
    return {
      setHorizontalRule:
        () =>
        ({ chain }) => {
          return (
            chain()
              .insertContent({ type: this.name })
              // set cursor after horizontal rule
              .command(({ tr, dispatch }) => {
                if (dispatch) {
                  const { $to } = tr.selection;
                  const posAfter = $to.end();

                  if ($to.nodeAfter) {
                    tr.setSelection(TextSelection.create(tr.doc, $to.pos));
                  } else {
                    // add node after horizontal rule if it’s the end of the document
                    const node = $to.parent.type.contentMatch.defaultType?.create();

                    if (node) {
                      tr.insert(posAfter, node);
                      tr.setSelection(TextSelection.create(tr.doc, posAfter));
                    }
                  }

                  tr.scrollIntoView();
                }

                return true;
              })
              .run()
          );
        },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^(?:---|—-|___\s|\*\*\*\s)$/,
        handler: ({ state, range, match }) => {
          state.tr.replaceRangeWith(range.from, range.to, this.type.create());
        },
      }),
    ];
  },
});
