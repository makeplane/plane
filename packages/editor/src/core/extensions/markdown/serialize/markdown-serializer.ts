import { Editor, Node as TiptapNode, Mark, AnyExtension } from "@tiptap/core";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import HTMLMark from "../extensions/marks/html";
import HardBreak from "../extensions/nodes/hard-break";
import HTMLNode from "../extensions/nodes/html";
import { getMarkdownSpec } from "../util/extensions";
import { MarkdownSerializerState } from "./state";

interface SerializerMark {
  open: string | ((state: MarkdownSerializerState, mark: Mark, parent: ProseMirrorNode, index: number) => string);
  close: string | ((state: MarkdownSerializerState, mark: Mark, parent: ProseMirrorNode, index: number) => string);
  mixable?: boolean;
  expelEnclosingWhitespace?: boolean;
  escape?: boolean;
}

interface SerializerNode {
  (state: MarkdownSerializerState, node: ProseMirrorNode, parent: ProseMirrorNode, index: number): void;
}

type SerializerNodes = Record<string, SerializerNode | undefined>;
type SerializerMarks = Record<string, SerializerMark | undefined>;

export class MarkdownSerializer {
  editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  serialize(content: ProseMirrorNode): string {
    const state = new MarkdownSerializerState(this.nodes, this.marks, {
      hardBreakNodeName: HardBreak.name,
    });

    state.renderContent(content);

    return state.out;
  }

  get nodes(): SerializerNodes {
    return {
      ...Object.fromEntries(Object.keys(this.editor.schema.nodes).map((name) => [name, this.serializeNode(HTMLNode)])),
      ...Object.fromEntries(
        this.editor.extensionManager.extensions
          .filter(
            (extension): extension is TiptapNode =>
              extension.type === "node" && extension instanceof TiptapNode && !!this.serializeNode(extension)
          )
          .map((extension) => [extension.name, this.serializeNode(extension)]) ?? []
      ),
    };
  }

  get marks(): SerializerMarks {
    return {
      ...Object.fromEntries(Object.keys(this.editor.schema.marks).map((name) => [name, this.serializeMark(HTMLMark)])),
      ...Object.fromEntries(
        this.editor.extensionManager.extensions
          .filter(
            (extension): extension is Mark =>
              extension.type === "mark" && extension instanceof Mark && !!this.serializeMark(extension)
          )
          .map((extension) => [extension.name, this.serializeMark(extension)]) ?? []
      ),
    };
  }

  serializeNode(node: AnyExtension): SerializerNode | undefined {
    return getMarkdownSpec(node)?.serialize?.bind({ editor: this.editor, options: node.options });
  }

  serializeMark(mark: AnyExtension): SerializerMark | undefined {
    const serialize = getMarkdownSpec(mark)?.serialize;
    return serialize
      ? {
          ...serialize,
          open:
            typeof serialize.open === "function"
              ? serialize.open.bind({ editor: this.editor, options: mark.options })
              : serialize.open,
          close:
            typeof serialize.close === "function"
              ? serialize.close.bind({ editor: this.editor, options: mark.options })
              : serialize.close,
        }
      : undefined;
  }
}
