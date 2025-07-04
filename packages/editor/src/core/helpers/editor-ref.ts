import { HocuspocusProvider } from "@hocuspocus/provider";
import { Editor } from "@tiptap/core";
import * as Y from "yjs";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import { CORE_EDITOR_META } from "@/constants/meta";
// types
import { EditorReadOnlyRefApi } from "@/types";
// local imports
import { getParagraphCount } from "./common";
import { getExtensionStorage } from "./get-extension-storage";
import { scrollSummary } from "./scroll-to-node";

type TArgs = {
  editor: Editor | null;
  provider: HocuspocusProvider | undefined;
};

export const getEditorRefHelpers = (args: TArgs): EditorReadOnlyRefApi => {
  const { editor, provider } = args;

  return {
    clearEditor: (emitUpdate = false) => {
      editor
        ?.chain()
        .setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true)
        .setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true)
        .clearContent(emitUpdate)
        .run();
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
    getDocumentInfo: () => ({
      characters: editor ? getExtensionStorage(editor, CORE_EXTENSIONS.CHARACTER_COUNT)?.characters?.() : 0,
      paragraphs: getParagraphCount(editor?.state),
      words: editor ? getExtensionStorage(editor, CORE_EXTENSIONS.CHARACTER_COUNT)?.words?.() : 0,
    }),
    getHeadings: () => (editor ? getExtensionStorage(editor, CORE_EXTENSIONS.HEADINGS_LIST)?.headings : []),
    getMarkDown: () => {
      const markdownOutput = editor?.storage?.markdown?.getMarkdown?.();
      return markdownOutput;
    },
    scrollSummary: (marking) => {
      if (!editor) return;
      scrollSummary(editor, marking);
    },
    setEditorValue: (content: string, emitUpdate = false) => {
      editor
        ?.chain()
        .setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true)
        .setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true)
        .setContent(content, emitUpdate, { preserveWhitespace: true })
        .run();
    },
  };
};
