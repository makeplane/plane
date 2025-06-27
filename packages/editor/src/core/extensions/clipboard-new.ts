import { Editor, Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { Fragment, Node } from "prosemirror-model";
import { NodeSelection, Plugin } from "prosemirror-state";
import { CellSelection } from "prosemirror-tables";
import * as pmView from "prosemirror-view";

import { EditorView } from "prosemirror-view";

function fragmentToExternalHTML(view: pmView.EditorView, selectedFragment: Fragment, editor: Editor) {
  let isWithinBlockContent = false;
  const isWithinTable = view.state.selection instanceof CellSelection;

  if (!isWithinTable) {
    // Checks whether block ancestry should be included when creating external
    // HTML. If the selection is within a block content node, the block ancestry
    // is excluded as we only care about the inline content.
    const fragmentWithoutParents = view.state.doc.slice(
      view.state.selection.from,
      view.state.selection.to,
      false
    ).content;
    // __AUTO_GENERATED_PRINT_VAR_START__
    console.log(
      "fragmentToExternalHTML#if fragmentWithoutParents: ",
      fragmentWithoutParents,
      JSON.stringify(fragmentWithoutParents) === JSON.stringify(selectedFragment)
    ); // __AUTO_GENERATED_PRINT_VAR_END__

    const children: Node[] = [];
    for (let i = 0; i < fragmentWithoutParents.childCount; i++) {
      children.push(fragmentWithoutParents.child(i));
    }

    isWithinBlockContent =
      children.find((child) => {
        // console.clear();
        console.log("child name:", child.type.name);
        console.log("child spec group:", child.type.spec.group);
        console.log("child isInGroup block:", child.type.isInGroup("block"));
        return child.type.isInGroup("block") || child.type.name === "block" || child.type.spec.group === "block";
      }) === undefined;
    console.log("isWithinBlockContent", isWithinBlockContent);
    if (isWithinBlockContent) {
      selectedFragment = fragmentWithoutParents;
    }
  }

  let externalHTML: string;

  const externalHTMLExporter = createExternalHTMLExporter(view.state.schema, editor);

  // if (isWithinTable) {
  //   // if (selectedFragment.firstChild?.type.name === "table") {
  //   //   // contentNodeToTableContent expects the fragment of the content of a table, not the table node itself
  //   //   // but cellselection.content() returns the table node itself if all cells and columns are selected
  //   //   selectedFragment = selectedFragment.firstChild.content;
  //   // }
  //   //
  //   // // first convert selection to blocknote-style table content, and then
  //   // // pass this to the exporter
  //   // const ic = contentNodeToTableContent(
  //   //   selectedFragment as any,
  //   //   editor.schema.inlineContentSchema,
  //   //   editor.schema.styleSchema
  //   // );
  //   //
  //   // // Wrap in table to ensure correct parsing by spreadsheet applications
  //   // externalHTML = `<table>${externalHTMLExporter.exportInlineContent(ic as any, {})}</table>`;
  //   if (isWithinBlockContent) {
  //     // first convert selection to blocknote-style inline content, and then
  //     // pass this to the exporter
  //     const ic = contentNodeToInlineContent(
  //       selectedFragment as any,
  //       editor.schema.inlineContentSchema,
  //       editor.schema.styleSchema
  //     );
  //     externalHTML = externalHTMLExporter.exportInlineContent(ic, {});
  //   }
  // } else {
  //   const blocks = fragmentToBlocks(selectedFragment, editor.schema);
  //   externalHTML = externalHTMLExporter.exportBlocks(blocks, {});
  // }
  // return externalHTML;
}

export function selectedFragmentToHTML(
  view: EditorView,
  editor: Editor
): {
  clipboardHTML: string;
  externalHTML: string;
  markdown?: string;
} {
  // Checks if a `blockContent` node is being copied and expands
  // the selection to the parent `blockContainer` node. This is
  // for the use-case in which only a block without content is
  // selected, e.g. an image block.
  if ("node" in view.state.selection && (view.state.selection.node as Node).type.spec.group === "blockContent") {
    editor.view.dispatch(
      editor.state.tr.setSelection(new NodeSelection(view.state.doc.resolve(view.state.selection.from - 1)))
    );
  }

  // Uses default ProseMirror clipboard serialization.
  const clipboardHTML: string = (pmView as any).__serializeForClipboard(view, view.state.selection.content()).dom
    .innerHTML;

  const selectedFragment = view.state.selection.content().content;
  console.log("selectedFragment", selectedFragment);

  const externalHTML = fragmentToExternalHTML(view, selectedFragment, editor);

  // const markdown = cleanHTMLToMarkdown(externalHTML);

  return { clipboardHTML, externalHTML };
}

const copyToClipboard = (editor: Editor, view: EditorView, event: ClipboardEvent) => {
  // Stops the default browser copy behaviour.
  event.preventDefault();
  event.clipboardData!.clearData();

  const { clipboardHTML, externalHTML } = selectedFragmentToHTML(view, editor);

  // TODO: Writing to other MIME types not working in Safari for
  //  some reason.
  event.clipboardData!.setData("blocknote/html", clipboardHTML);
  event.clipboardData!.setData("text/html", externalHTML);
  // event.clipboardData!.setData("text/plain", markdown);
};

export const createCopyToClipboardExtension = () =>
  Extension.create({
    name: "copyToClipboard",
    addProseMirrorPlugins(this) {
      const { editor } = this;
      return [
        new Plugin({
          key: new PluginKey("copyToClipboard"),
          props: {
            handleDOMEvents: {
              copy(view, event) {
                copyToClipboard(editor, view, event);
                // Prevent default PM handler to be called
                return true;
              },
              cut(view, event) {
                copyToClipboard(editor, view, event);
                if (view.editable) {
                  view.dispatch(view.state.tr.deleteSelection());
                }
                // Prevent default PM handler to be called
                return true;
              },
              // This is for the use-case in which only a block without content
              // is selected, e.g. an image block, and dragged (not using the
              // drag handle).
              // dragstart(view, event) {
              //   // Checks if a `NodeSelection` is active.
              //   if (!("node" in view.state.selection)) {
              //     return;
              //   }
              //
              //   // Checks if a `blockContent` node is being dragged.
              //   if ((view.state.selection.node as Node).type.spec.group !== "blockContent") {
              //     return;
              //   }
              //
              //   // Expands the selection to the parent `blockContainer` node.
              //   editor.dispatch(
              //     editor._tiptapEditor.state.tr.setSelection(
              //       new NodeSelection(view.state.doc.resolve(view.state.selection.from - 1))
              //     )
              //   );
              //
              //   // Stops the default browser drag start behaviour.
              //   event.preventDefault();
              //   event.dataTransfer!.clearData();
              //
              //   const { clipboardHTML, externalHTML, markdown } = selectedFragmentToHTML(view, editor);
              //
              //   // TODO: Writing to other MIME types not working in Safari for
              //   //  some reason.
              //   event.dataTransfer!.setData("blocknote/html", clipboardHTML);
              //   event.dataTransfer!.setData("text/html", externalHTML);
              //   event.dataTransfer!.setData("text/plain", markdown);
              //
              //   // Prevent default PM handler to be called
              //   return true;
              // },
            },
          },
        }),
      ];
    },
  });

export function contentNodeToInlineContent(contentNode: Node, inlineContentSchema: any, styleSchema: any) {
  const content = [];
  let currentContent;

  // Most of the logic below is for handling links because in ProseMirror links are marks
  // while in BlockNote links are a type of inline content
  contentNode.content.forEach((node) => {
    // hardBreak nodes do not have an InlineContent equivalent, instead we
    // add a newline to the previous node.
    if (node.type.name === "hardBreak") {
      if (currentContent) {
        // Current content exists.
        if (isStyledTextInlineContent(currentContent)) {
          // Current content is text.
          currentContent.text += "\n";
        } else if (isLinkInlineContent(currentContent)) {
          // Current content is a link.
          currentContent.content[currentContent.content.length - 1].text += "\n";
        } else {
          throw new Error("unexpected");
        }
      } else {
        // Current content does not exist.
        currentContent = {
          type: "text",
          text: "\n",
          styles: {},
        };
      }

      return;
    }

    if (node.type.name !== "link" && node.type.name !== "text" && inlineContentSchema[node.type.name]) {
      if (currentContent) {
        content.push(currentContent);
        currentContent = undefined;
      }

      content.push(nodeToCustomInlineContent(node, inlineContentSchema, styleSchema));

      return;
    }

    const styles = {};
    let linkMark;

    for (const mark of node.marks) {
      if (mark.type.name === "link") {
        linkMark = mark;
      } else {
        const config = styleSchema[mark.type.name];
        if (!config) {
          throw new Error(`style ${mark.type.name} not found in styleSchema`);
        }
        if (config.propSchema === "boolean") {
          (styles as any)[config.type] = true;
        } else if (config.propSchema === "string") {
          (styles as any)[config.type] = mark.attrs.stringValue;
        } else {
        }
      }
    }

    // Parsing links and text.
    // Current content exists.
    if (currentContent) {
      // Current content is text.
      if (isStyledTextInlineContent(currentContent)) {
        if (!linkMark) {
          // Node is text (same type as current content).
          if (JSON.stringify(currentContent.styles) === JSON.stringify(styles)) {
            // Styles are the same.
            currentContent.text += node.textContent;
          } else {
            // Styles are different.
            content.push(currentContent);
            currentContent = {
              type: "text",
              text: node.textContent,
              styles,
            };
          }
        } else {
          // Node is a link (different type to current content).
          content.push(currentContent);
          currentContent = {
            type: "link",
            href: linkMark.attrs.href,
            content: [
              {
                type: "text",
                text: node.textContent,
                styles,
              },
            ],
          };
        }
      } else if (isLinkInlineContent(currentContent)) {
        // Current content is a link.
        if (linkMark) {
          // Node is a link (same type as current content).
          // Link URLs are the same.
          if (currentContent.href === linkMark.attrs.href) {
            // Styles are the same.
            if (
              JSON.stringify(currentContent.content[currentContent.content.length - 1].styles) ===
              JSON.stringify(styles)
            ) {
              currentContent.content[currentContent.content.length - 1].text += node.textContent;
            } else {
              // Styles are different.
              currentContent.content.push({
                type: "text",
                text: node.textContent,
                styles,
              });
            }
          } else {
            // Link URLs are different.
            content.push(currentContent);
            currentContent = {
              type: "link",
              href: linkMark.attrs.href,
              content: [
                {
                  type: "text",
                  text: node.textContent,
                  styles,
                },
              ],
            };
          }
        } else {
          // Node is text (different type to current content).
          content.push(currentContent);
          currentContent = {
            type: "text",
            text: node.textContent,
            styles,
          };
        }
      } else {
        // TODO
      }
    }
    // Current content does not exist.
    else {
      // Node is text.
      if (!linkMark) {
        currentContent = {
          type: "text",
          text: node.textContent,
          styles,
        };
      }
      // Node is a link.
      else {
        currentContent = {
          type: "link",
          href: linkMark.attrs.href,
          content: [
            {
              type: "text",
              text: node.textContent,
              styles,
            },
          ],
        };
      }
    }
  });

  if (currentContent) {
    content.push(currentContent);
  }

  return content;
}

export function isLinkInlineContent(content: { type: string }): boolean {
  return content.type === "link";
}

export function isStyledTextInlineContent(content: { type: string }): boolean {
  return typeof content !== "string" && content.type === "text";
}

export function nodeToCustomInlineContent(node: Node, inlineContentSchema: any, styleSchema: any) {
  if (node.type.name === "text" || node.type.name === "link") {
    throw new Error("unexpected");
  }
  const props: any = {};
  const icConfig = inlineContentSchema[node.type.name];
  for (const [attr, value] of Object.entries(node.attrs)) {
    if (!icConfig) {
      throw Error("ic node is of an unrecognized type: " + node.type.name);
    }

    const propSchema = icConfig.propSchema;

    if (attr in propSchema) {
      props[attr] = value;
    }
  }

  let content;

  if (icConfig.content === "styled") {
    content = contentNodeToInlineContent(node, inlineContentSchema, styleSchema) as any; // TODO: is this safe? could we have Links here that are undesired?
  } else {
    content = undefined;
  }

  const ic = {
    type: node.type.name,
    props,
    content,
  };
  return ic;
}
