import { mergeAttributes, Node, textblockTypeInputRule } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { DOMParser } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";

export interface CodeBlockOptions {
  /**
   * Adds a prefix to language classes that are applied to code tags.
   * Defaults to `'language-'`.
   */
  languageClassPrefix: string;
  /**
   * Define whether the node should be exited on triple enter.
   * Defaults to `true`.
   */
  exitOnTripleEnter: boolean;
  /**
   * Define whether the node should be exited on arrow down if there is no node after it.
   * Defaults to `true`.
   */
  exitOnArrowDown: boolean;
  /**
   * Custom HTML attributes that should be added to the rendered HTML tag.
   */
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    codeBlock: {
      /**
       * Set a code block
       */
      setCodeBlock: (attributes?: { language: string }) => ReturnType;
      /**
       * Toggle a code block
       */
      toggleCodeBlock: (attributes?: { language: string }) => ReturnType;
    };
  }
}

export const backtickInputRegex = /^```([a-z]+)?[\s\n]$/;
export const tildeInputRegex = /^~~~([a-z]+)?[\s\n]$/;

export const CodeBlock = Node.create<CodeBlockOptions>({
  name: "codeBlock",

  addOptions() {
    return {
      languageClassPrefix: "language-",
      exitOnTripleEnter: true,
      exitOnArrowDown: true,
      HTMLAttributes: {},
    };
  },
  content: "text*",

  marks: "",

  group: "block",

  code: true,

  defining: true,

  addAttributes() {
    return {
      language: {
        default: null,
        parseHTML: (element) => {
          const { languageClassPrefix } = this.options;
          const classNames = [...(element.firstElementChild?.classList || [])];
          const languages = classNames
            .filter((className) => className.startsWith(languageClassPrefix))
            .map((className) => className.replace(languageClassPrefix, ""));
          const language = languages[0];

          if (!language) {
            return null;
          }

          return language;
        },
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre",
        preserveWhitespace: "full",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "pre",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      [
        "code",
        {
          class: node.attrs.language ? this.options.languageClassPrefix + node.attrs.language : null,
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setCodeBlock:
        (attributes) =>
        ({ commands }) =>
          commands.setNode(this.name, attributes),
      toggleCodeBlock:
        (attributes) =>
        ({ commands }) =>
          commands.toggleNode(this.name, "paragraph", attributes),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),

      // remove code block when at start of document or code block is empty
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection;
        const isAtStart = $anchor.pos === 1;

        if (!empty || $anchor.parent.type.name !== this.name) {
          return false;
        }

        if (isAtStart || !$anchor.parent.textContent.length) {
          return this.editor.commands.clearNodes();
        }

        return false;
      },

      // exit node on triple enter
      Enter: ({ editor }) => {
        if (!this.options.exitOnTripleEnter) {
          return false;
        }

        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
        const endsWithDoubleNewline = $from.parent.textContent.endsWith("\n\n");

        if (!isAtEnd || !endsWithDoubleNewline) {
          return false;
        }

        return editor
          .chain()
          .command(({ tr }) => {
            tr.delete($from.pos - 2, $from.pos);

            return true;
          })
          .exitCode()
          .run();
      },

      // exit node on arrow down
      ArrowDown: ({ editor }) => {
        if (!this.options.exitOnArrowDown) {
          return false;
        }

        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;

        if (!isAtEnd) {
          return false;
        }

        const after = $from.after();

        if (after === undefined) {
          return false;
        }

        const nodeAfter = doc.nodeAt(after);

        if (nodeAfter) {
          return false;
        }

        return editor.commands.exitCode();
      },
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: match[1],
        }),
      }),
      textblockTypeInputRule({
        find: tildeInputRegex,
        type: this.type,
        getAttributes: (match) => ({
          language: match[1],
        }),
      }),
    ];
  },
  // addProseMirrorPlugins() {
  //   return [
  //     new Plugin({
  //       key: new PluginKey("codeBlockVSCodeHandler"),
  //       props: {
  //         handlePaste: (view, event) => {
  //           if (!event.clipboardData) {
  //             return false;
  //           }
  //
  //           // Don’t create a new code block within code blocks
  //           if (this.editor.isActive(this.type.name) || this.editor.isActive("code")) {
  //             return false;
  //           }
  //
  //           const text = event.clipboardData.getData("text/plain");
  //           const vscode = event.clipboardData.getData("vscode-editor-data");
  //           const vscodeData = vscode ? JSON.parse(vscode) : undefined;
  //           const language = vscodeData?.mode;
  //
  //           if (!text || !language) {
  //             console.log("hittttttttttttt");
  //             return false;
  //           }
  //
  //           const { tr } = view.state;
  //           const { from, to } = tr.selection;
  //
  //           // Replace the selection with a new code block
  //           const codeBlock = this.type.create({ language });
  //           tr.replaceRangeWith(from, to, codeBlock);
  //
  //           // Calculate the position for inserting the text
  //           // It should be right inside the newly created code block
  //           const insertPos = from; // Adjusted to insert text inside the code block
  //
  //           // Insert the text into the code block
  //           tr.insertText(text.replace(/\r\n?/g, "\n"), insertPos);
  //
  //           // Set the selection to the end of the inserted text
  //           const endPos = insertPos + text.length;
  //           tr.setSelection(TextSelection.create(tr.doc, endPos));
  //
  //           // Apply the transaction
  //           view.dispatch(tr);
  //
  //           return true;
  //         },
  //       },
  //     }),
  //   ];
  // },
  // addProseMirrorPlugins() {
  //   return [
  //     new Plugin({
  //       key: new PluginKey("codeBlockVSCodeHandler"),
  //       props: {
  //         handlePaste: (view, event) => {
  //           if (!event.clipboardData) {
  //             return false;
  //           }
  //
  //           const text = event.clipboardData.getData("text/plain");
  //           const vscode = event.clipboardData.getData("vscode-editor-data");
  //           const vscodeData = vscode ? JSON.parse(vscode) : undefined;
  //           const language = vscodeData?.mode;
  //
  //           // Check if the paste is from VS Code with specific metadata
  //           if (vscodeData && language) {
  //             // Handle paste from VS Code
  //             const { tr } = view.state;
  //             const { from, to } = tr.selection;
  //
  //             // Replace the selection with a new code block
  //             const codeBlock = this.type.create({ language });
  //             tr.replaceRangeWith(from, to, codeBlock);
  //
  //             // Insert the text into the code block
  //             tr.insertText(text.replace(/\r\n?/g, "\n"), from);
  //
  //             // Set the selection to the end of the inserted text
  //             const endPos = from + text.length;
  //             tr.setSelection(TextSelection.create(tr.doc, endPos));
  //
  //             // Apply the transaction
  //             view.dispatch(tr);
  //             return true;
  //           } else {
  //             // Handle paste from other sources
  //             // Prevent default paste handling to insert text with preserved formatting
  //             // event.preventDefault();
  //
  //             // Insert text directly, preserving formatting
  //             const { tr } = view.state;
  //             const insertPos = tr.selection.from;
  //             tr.insertText(text.replace(/\r\n?/g, "\n"), insertPos);
  //             view.dispatch(tr);
  //             return true;
  //           }
  //         },
  //       },
  //     }),
  //   ];
  // },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("codeBlockVSCodeHandler"),
        props: {
          handlePaste: (view, event) => {
            console.log("ye chala");
            if (!event.clipboardData) {
              return false;
            }

            if (this.editor.isActive(this.type.name) || this.editor.isActive("code")) {
              return false;
            }
            const text = event.clipboardData.getData("text/plain");
            const vscode = event.clipboardData.getData("vscode-editor-data");
            const vscodeData = vscode ? JSON.parse(vscode) : undefined;
            const language = vscodeData?.mode;

            if (vscodeData && language) {
              console.log("Handling paste from VS Code");
              const { tr } = view.state;
              const { $from } = tr.selection;

              // Check if the current line is empty
              const isCurrentLineEmpty = !$from.parent.textContent.trim();

              let insertPos;

              if (isCurrentLineEmpty) {
                // If the current line is empty, use the current position
                insertPos = $from.pos;
              } else {
                // If the current line is not empty, insert below the current block node
                // Find the end of the block node and add 1 to move to the next line
                insertPos = $from.end($from.depth) + 1;
              }

              // Create a new code block node with the pasted content
              const codeBlock = this.type.create({ language });
              const textNode = view.state.schema.text(text.replace(/\r\n?/g, "\n"));

              // Begin a transaction to insert the new content
              tr.insert(insertPos, codeBlock); // Insert the code block at the calculated position
              tr.insert(insertPos + 1, textNode); // Insert the text inside the code block

              // Optionally, set the selection to the end of the inserted text
              const endPos = insertPos + textNode.nodeSize;
              tr.setSelection(TextSelection.create(tr.doc, endPos));

              // Dispatch the transaction
              view.dispatch(tr);
              return true;
            } else {
              if (!isCurrentLineEmpty(view)) {
                console.log("yw");
                return false;
              }

              // event.preventDefault();
              //
              // // Split the text by line breaks and wrap each line in a <p> tag
              // const lines = text.split(/\r?\n/);
              // const html = lines.map((line) => `<p>${line}</p>`).join("");
              //
              // // Use the insertContent command to insert the HTML
              // this.editor.commands.insertContent(html);
              // return true;
              event.preventDefault();

              // Wrap the text in a div
              const html = `<div>${text.replace(/\r?\n/g, "<br>")}</div>`;

              // Parse the HTML string to a ProseMirror document fragment
              const div = document.createElement("div");
              div.innerHTML = html;
              const domNode = div.firstChild;
              if (!domNode) {
                return false;
              }
              const fragment = DOMParser.fromSchema(view.state.schema).parse(domNode);

              // Insert the fragment into the document
              const transaction = view.state.tr.insert(view.state.selection.from - 1, fragment);
              view.dispatch(transaction);

              return true;
            }
          },
        },
      }),
    ];
  },
});

function isCurrentLineEmpty(view: EditorView) {
  const { $from } = view.state.selection;
  const blockNode = $from.node($from.depth); // Get the block node at the current selection depth

  // Check if the block node is empty or only contains whitespace
  const isEmpty = !blockNode.textContent.trim();

  return isEmpty;
}
