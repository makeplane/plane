// @ts-nocheck
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { EditorBubbleMenu } from "./bubble-menu";
import { TiptapExtensions } from "./extensions";
import { TiptapEditorProps } from "./props";
import { Node } from "@tiptap/pm/model";
import { Editor as CoreEditor } from "@tiptap/core";
import { useCallback, useImperativeHandle, useRef } from "react";
import { EditorState } from "@tiptap/pm/state";
import fileService from "services/file.service";

export interface ITiptapRichTextEditor {
  value: string;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange?: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  editable?: boolean;
  forwardedRef?: any;
  debouncedUpdatesEnabled?: boolean;
}

const Tiptap = (props: ITiptapRichTextEditor) => {
  const {
    onChange,
    debouncedUpdatesEnabled,
    forwardedRef,
    editable,
    setIsSubmitting,
    editorContentCustomClassNames,
    value,
    noBorder,
    borderOnFocus,
    customClassName,
  } = props;

  const editor = useEditor({
    editable: editable ?? true,
    editorProps: TiptapEditorProps,
    extensions: TiptapExtensions,
    content: value,
    onUpdate: async ({ editor }) => {
      // for instant feedback loop
      setIsSubmitting?.("submitting");
      checkForNodeDeletions(editor);
      if (debouncedUpdatesEnabled) {
        debouncedUpdates({ onChange, editor });
      } else {
        onChange?.(editor.getJSON(), editor.getHTML());
      }
    },
  });

  const editorRef: React.MutableRefObject<Editor | null> = useRef(null);

  useImperativeHandle(forwardedRef, () => ({
    clearEditor: () => {
      editorRef.current?.commands.clearContent();
    },
    setEditorValue: (content: string) => {
      editorRef.current?.commands.setContent(content);
    },
  }));

  const previousState = useRef<EditorState>();

  const onNodeDeleted = useCallback(async (node: Node) => {
    if (node.type.name === "image") {
      const assetUrlWithWorkspaceId = new URL(node.attrs.src).pathname.substring(1);
      const resStatus = await fileService.deleteImage(assetUrlWithWorkspaceId);
      if (resStatus === 204) {
        console.log("file deleted successfully");
      }
    }
  }, []);

  const checkForNodeDeletions = useCallback(
    (editor: CoreEditor) => {
      const prevNodesById: Record<string, Node> = {};
      previousState.current?.doc.forEach((node) => {
        if (node.attrs.id) {
          prevNodesById[node.attrs.id] = node;
        }
      });

      const nodesById: Record<string, Node> = {};
      editor.state?.doc.forEach((node) => {
        if (node.attrs.id) {
          nodesById[node.attrs.id] = node;
        }
      });

      previousState.current = editor.state;

      for (const [id, node] of Object.entries(prevNodesById)) {
        if (nodesById[id] === undefined) {
          onNodeDeleted(node);
        }
      }
    },
    [onNodeDeleted]
  );

  const debouncedUpdates = useDebouncedCallback(async ({ onChange, editor }) => {
    setTimeout(async () => {
      if (onChange) {
        onChange(editor.getJSON(), editor.getHTML());
      }
    }, 500);
  }, 1000);

  const editorClassNames = `relative w-full max-w-screen-lg mt-2 p-3 relative focus:outline-none rounded-lg
      ${noBorder ? "" : "border border-custom-border-200"} ${
    borderOnFocus ? "focus:border border-custom-border-300" : "focus:border-0"
  } ${customClassName}`;

  if (!editor) return null;
  editorRef.current = editor;

  return (
    <div
      id="tiptap-container"
      onClick={() => {
        editor?.chain().focus().run();
      }}
      className={`tiptap-editor-container cursor-text ${editorClassNames}`}
    >
      {editor && <EditorBubbleMenu editor={editor} />}
      <div className={`${editorContentCustomClassNames}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Tiptap;
