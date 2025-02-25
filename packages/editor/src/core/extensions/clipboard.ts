import { Extension } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Node as ProsemirrorNode } from "prosemirror-model";

export const MarkdownClipboard = Extension.create({
  name: 'markdownClipboard',
  addOptions() {
    return {
      transformPastedText: false,
      transformCopiedText: false,
    }
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownClipboard'),
        props: {
          clipboardTextSerializer: (slice) => {
            const isMultiline = slice.content.childCount > 1;

            const copyAsMarkdown =
              isMultiline ||
              slice.content.content.some(
                (node) => node.content.content.length > 1
              );

            if (!copyAsMarkdown) {
              return slice.content.content.map((node) =>
                toPlainText(node, this.editor.schema)
              ).join('')

            }

            return this.editor.storage.markdown.serializer.serialize(slice.content);
          },
        }
      })
    ]
  }
})

function toPlainText(root: ProsemirrorNode, schema: Schema) {
  const textSerializers = getTextSerializers(schema);
  return textBetween(root, 0, root.content.size, textSerializers);
}
export function getTextSerializers(schema: Schema) {
  return Object.fromEntries(
    Object.entries(schema.nodes)
      .filter(([, node]) => node.spec.toPlainText)
      .map(([name, node]) => [name, node.spec.toPlainText])
  );
}

export type PlainTextSerializer = (node: ProsemirrorNode) => string;
export default function textBetween(
  doc: ProsemirrorNode,
  from: number,
  to: number,
  plainTextSerializers: Record<string, PlainTextSerializer | undefined>
): string {
  let text = "";
  let first = true;
  const blockSeparator = "\n";

  doc.nodesBetween(from, to, (node, pos) => {
    const toPlainText = plainTextSerializers[node.type.name];
    let nodeText = "";

    if (toPlainText) {
      nodeText += toPlainText(node);
    } else if (node.isText) {
      nodeText += node.textBetween(
        Math.max(from, pos) - pos,
        to - pos,
        blockSeparator
      );
    }

    if (
      node.isBlock &&
      ((node.isLeaf && nodeText) || node.isTextblock) &&
      blockSeparator
    ) {
      if (first) {
        first = false;
      } else {
        text += blockSeparator;
      }
    }

    text += nodeText;
  });

  return text;
}
