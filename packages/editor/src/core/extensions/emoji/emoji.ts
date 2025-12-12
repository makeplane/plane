import {
  combineTransactionSteps,
  escapeForRegEx,
  findChildrenInRange,
  getChangedRanges,
  InputRule,
  mergeAttributes,
  Node,
  nodeInputRule,
  PasteRule,
  removeDuplicates,
} from "@tiptap/core";
import type { EmojiStorage } from "@tiptap/extension-emoji";
import { emojis, emojiToShortcode, shortcodeToEmoji } from "@tiptap/extension-emoji";
import { Fragment } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { SuggestionOptions } from "@tiptap/suggestion";
import Suggestion from "@tiptap/suggestion";
import emojiRegex from "emoji-regex";
import { isEmojiSupported } from "is-emoji-supported";
// helpers
import { customFindSuggestionMatch } from "@/helpers/find-suggestion-match";

// Extended storage type to include our custom forceOpen flag
export interface ExtendedEmojiStorage extends EmojiStorage {
  forceOpen: boolean;
}

export type EmojiItem = {
  /**
   * A unique name of the emoji which will be stored as attribute
   */
  name: string;
  /**
   * The emoji unicode character
   */
  emoji?: string;
  /**
   * A list of unique shortcodes that are used by input rules to find the emoji
   */
  shortcodes: string[];
  /**
   * A list of tags that can help for searching emojis
   */
  tags: string[];
  /**
   * A name that can help to group emojis
   */
  group?: string;
  /**
   * A list of unique emoticons
   */
  emoticons?: string[];
  /**
   * The unicode version the emoji was introduced
   */
  version?: number;
  /**
   * A fallback image if the current system doesn't support the emoji or for custom emojis
   */
  fallbackImage?: string;
  /**
   * Store some custom data
   */
  [key: string]: unknown;
};

export type EmojiOptions = {
  HTMLAttributes: Record<string, unknown>;
  emojis: EmojiItem[];
  enableEmoticons: boolean;
  forceFallbackImages: boolean;
  suggestion: Omit<SuggestionOptions, "editor">;
};

export const EmojiSuggestionPluginKey = new PluginKey("emojiSuggestion");

export const inputRegex = /:([a-zA-Z0-9_+-]+):$/;

export const pasteRegex = /:([a-zA-Z0-9_+-]+):/g;

export const Emoji = Node.create<EmojiOptions, EmojiStorage>({
  name: "emoji",

  inline: true,

  group: "inline",

  selectable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
      // emojis: ,
      emojis: emojis,
      enableEmoticons: false,
      forceFallbackImages: false,
      suggestion: {
        char: ":",
        pluginKey: EmojiSuggestionPluginKey,
        command: ({ editor, range, props }) => {
          // increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(" ");

          if (overrideSpace) {
            range.to += 1;
          }

          editor
            .chain()
            .focus()
            .command(({ tr, state, dispatch }) => {
              if (!dispatch) return true;

              const { schema } = state;
              const emojiNode = schema.nodes[this.name].create(props);
              const spaceNode = schema.text(" ");

              const fragment = Fragment.from([emojiNode, spaceNode]);

              tr.replaceWith(range.from, range.to, fragment);

              const newPos = range.from + fragment.size;
              tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));

              tr.setStoredMarks(tr.doc.resolve(range.from).marks());

              return true;
            })
            .run();
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const type = state.schema.nodes[this.name];
          const allow = !!$from.parent.type.contentMatch.matchType(type);

          return allow;
        },
      },
    };
  },

  addStorage() {
    const { emojis } = this.options;
    const supportMap: Record<number, boolean> = removeDuplicates(emojis.map((item) => item.version))
      .filter((version) => typeof version === "number")
      .reduce((versions, version) => {
        const emoji = emojis.find((item) => item.version === version && item.emoji);

        return {
          ...versions,
          [version]: emoji ? isEmojiSupported(emoji.emoji as string) : false,
        };
      }, {});

    return {
      emojis: this.options.emojis,
      isSupported: (emojiItem) => (emojiItem.version ? supportMap[emojiItem.version] : false),
      forceOpen: false,
    };
  },

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.dataset.name,
        renderHTML: (attributes) => ({
          "data-name": attributes.name,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const emojiItem = shortcodeToEmoji(node.attrs.name, this.options.emojis);
    const attributes = mergeAttributes(HTMLAttributes, this.options.HTMLAttributes, { "data-type": this.name });

    if (!emojiItem) {
      return ["span", attributes, `:${node.attrs.name}:`];
    }

    const renderFallbackImage = false;

    return [
      "span",
      attributes,
      renderFallbackImage
        ? [
            "img",
            {
              src: emojiItem.fallbackImage,
              draggable: "false",
              loading: "lazy",
              align: "absmiddle",
            },
          ]
        : emojiItem.emoji || `:${emojiItem.shortcodes[0]}:`,
    ];
  },

  renderText({ node }) {
    const emojiItem = shortcodeToEmoji(node.attrs.name, this.options.emojis);

    return emojiItem?.emoji || `:${node.attrs.name}:`;
  },

  addCommands() {
    return {
      setEmoji:
        (shortcode) =>
        ({ chain }) => {
          const emojiItem = shortcodeToEmoji(shortcode, this.options.emojis);

          if (!emojiItem) {
            return false;
          }

          chain()
            .insertContent({
              type: this.name,
              attrs: {
                name: emojiItem.name,
              },
            })
            .command(({ tr, state }) => {
              tr.setStoredMarks(state.doc.resolve(state.selection.to - 1).marks());
              return true;
            })
            .run();

          return true;
        },
    };
  },

  addInputRules() {
    const inputRules: InputRule[] = [];

    inputRules.push(
      new InputRule({
        find: inputRegex,
        handler: ({ range, match, chain }) => {
          const name = match[1];

          if (!shortcodeToEmoji(name, this.options.emojis)) {
            return;
          }

          chain()
            .insertContentAt(range, {
              type: this.name,
              attrs: {
                name,
              },
            })
            .command(({ tr, state }) => {
              tr.setStoredMarks(state.doc.resolve(state.selection.to - 1).marks());
              return true;
            })
            .run();
        },
      })
    );

    if (this.options.enableEmoticons) {
      // get the list of supported emoticons
      const emoticons = this.options.emojis
        .map((item) => item.emoticons)
        .flat()
        .filter((item) => item) as string[];

      const emoticonRegex = new RegExp(`(?:^|\\s)(${emoticons.map((item) => escapeForRegEx(item)).join("|")}) $`);

      inputRules.push(
        nodeInputRule({
          find: emoticonRegex,
          type: this.type,
          getAttributes: (match) => {
            const emoji = this.options.emojis.find((item) => item.emoticons?.includes(match[1]));

            if (!emoji) {
              return;
            }

            return {
              name: emoji.name,
            };
          },
        })
      );
    }

    return inputRules;
  },

  addPasteRules() {
    return [
      new PasteRule({
        find: pasteRegex,
        handler: ({ range, match, chain }) => {
          const name = match[1];

          if (!shortcodeToEmoji(name, this.options.emojis)) {
            return;
          }

          chain()
            .insertContentAt(
              range,
              {
                type: this.name,
                attrs: {
                  name,
                },
              },
              {
                updateSelection: false,
              }
            )
            .command(({ tr, state }) => {
              tr.setStoredMarks(state.doc.resolve(state.selection.to - 1).marks());
              return true;
            })
            .run();
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    const isTouchDevice = !!this.editor.storage.utility.isTouchDevice;
    if (isTouchDevice) {
      return [];
    }
    return [
      Suggestion({
        editor: this.editor,
        findSuggestionMatch: customFindSuggestionMatch,
        ...this.options.suggestion,
      }),

      new Plugin({
        key: new PluginKey("emoji"),
        props: {
          // double click to select emoji doesn’t work by default
          // that’s why we simulate this behavior
          handleDoubleClickOn: (view, pos, node) => {
            if (node.type !== this.type) {
              return false;
            }

            const from = pos;
            const to = from + node.nodeSize;

            this.editor.commands.setTextSelection({
              from,
              to,
            });

            return true;
          },
        },

        // replace text emojis with emoji node on any change
        appendTransaction: (transactions, oldState, newState) => {
          const docChanges =
            transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);

          if (!docChanges) {
            return;
          }

          const { tr } = newState;
          const transform = combineTransactionSteps(oldState.doc, transactions as Transaction[]);
          const changes = getChangedRanges(transform);

          changes.forEach(({ newRange }) => {
            // We don’t want to add emoji inline nodes within code blocks.
            // Because this would split the code block.

            // This only works if the range of changes is within a code node.
            // For all other cases (e.g. the whole document is set/pasted and the parent of the range is `doc`)
            // it doesn't and we have to double check later.
            if (newState.doc.resolve(newRange.from).parent.type.spec.code) {
              return;
            }

            const textNodes = findChildrenInRange(newState.doc, newRange, (node) => node.type.isText);

            textNodes.forEach(({ node, pos }) => {
              if (!node.text) {
                return;
              }

              const matches = [...node.text.matchAll(emojiRegex())];

              matches.forEach((match) => {
                if (match.index === undefined) {
                  return;
                }

                const emoji = match[0];
                const name = emojiToShortcode(emoji, this.options.emojis);

                if (!name) {
                  return;
                }

                const from = tr.mapping.map(pos + match.index);

                // Double check parent node is not a code block.
                if (newState.doc.resolve(from).parent.type.spec.code) {
                  return;
                }

                const to = from + emoji.length;
                const emojiNode = this.type.create({
                  name,
                });

                tr.replaceRangeWith(from, to, emojiNode);

                tr.setStoredMarks(newState.doc.resolve(from).marks());
              });
            });
          });

          if (!tr.steps.length) {
            return;
          }

          return tr;
        },
      }),
    ];
  },
});
