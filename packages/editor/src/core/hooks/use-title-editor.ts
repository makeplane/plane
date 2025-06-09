import { HocuspocusProvider } from "@hocuspocus/provider";
import { Extensions } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { DOMSerializer } from "@tiptap/pm/model";
import { useEditor } from "@tiptap/react";
import { useImperativeHandle } from "react";
import * as Y from "yjs";
// extensions
import { IMarking, SmoothCursorExtension } from "@/extensions";
import { TitleExtensions } from "@/extensions/title-extension";
// helpers
import { getParagraphCount } from "@/helpers/common";
import { scrollSummary } from "@/helpers/scroll-to-node";
// types
import { EditorTitleRefApi } from "@/types/editor";

export interface TitleEditorProps {
  editable?: boolean;
  provider: HocuspocusProvider;
  titleRef?: React.MutableRefObject<EditorTitleRefApi | null>;
  extensions?: Extensions;
  initialValue?: string;
  field?: string;
  placeholder?: string;
  updatePageProperties?: (pageId: string, messageType: string, payload?: any, performAction?: boolean) => void;
  id: string;
  isSmoothCursorEnabled: boolean;
}

/**
 * A hook that creates a title editor with collaboration features
 * Uses the same Y.Doc as the main editor but a different field
 */
export const useTitleEditor = (props: TitleEditorProps) => {
  const {
    editable = true,
    id,
    initialValue = "",
    isSmoothCursorEnabled = false,
    extensions,
    provider,
    updatePageProperties,
    titleRef,
  } = props;

  const editor = useEditor(
    {
      onUpdate: () => {
        if (updatePageProperties) {
          updatePageProperties(id, "title_updated", { title: editor?.getText() });
        }
      },
      editable,
      extensions: [
        ...TitleExtensions,
        ...(extensions ?? []),
        ...(isSmoothCursorEnabled ? [SmoothCursorExtension] : []),
        Placeholder.configure({
          placeholder: () => "Untitled",
          includeChildren: true,
          showOnlyWhenEditable: false,
        }),
      ],
      content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<h1></h1>",
    },
    [editable, initialValue]
  );

  useImperativeHandle(titleRef, () => ({
    clearEditor: (emitUpdate = false) => {
      editor
        ?.chain()
        .setMeta("skipImageDeletion", true)
        .setMeta("intentionalDeletion", true)
        .clearContent(emitUpdate)
        .run();
    },
    setEditorValue: (content: string) => {
      editor?.commands.setContent(content);
    },
    blur: () => editor?.commands.blur(),
    getHeadings: () => editor?.storage.headingList.headings,
    getMarkDown: (): string => {
      const markdownOutput = editor?.storage.markdown.getMarkdown();
      return markdownOutput;
    },
    getDocument: () => {
      const documentBinary = provider?.document ? Y.encodeStateAsUpdate(provider?.document) : null;
      const documentHTML = editor?.getHTML() ?? "<p></p>";
      const documentJSON = editor?.getJSON() ?? null;

      return {
        binary: documentBinary,
        html: documentHTML,
        json: documentJSON,
      };
    },
    scrollSummary: (marking: IMarking): void => {
      if (!editor) return;
      scrollSummary(editor, marking);
    },
    getSelectedText: () => {
      if (!editor) return null;

      const { state } = editor;
      const { from, to, empty } = state.selection;

      if (empty) return null;

      const nodesArray: string[] = [];
      state.doc.nodesBetween(from, to, (node, _pos, parent) => {
        if (parent === state.doc && editor) {
          const serializer = DOMSerializer.fromSchema(editor.schema);
          const dom = serializer.serializeNode(node);
          const tempDiv = document.createElement("div");
          tempDiv.appendChild(dom);
          nodesArray.push(tempDiv.innerHTML);
        }
      });
      const selection = nodesArray.join("");
      return selection;
    },
    getDocumentInfo: () => ({
      characters: editor?.storage?.characterCount?.characters?.() ?? 0,
      paragraphs: getParagraphCount(editor?.state),
      words: editor?.storage?.characterCount?.words?.() ?? 0,
    }),
  }));

  return editor;
};
