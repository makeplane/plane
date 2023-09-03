import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { useDebouncedCallback } from "use-debounce";
import { EditorBubbleMenu } from "./bubble-menu";
import { TiptapExtensions } from "./extensions";
import { TiptapEditorProps } from "./props";
import { useImperativeHandle, useRef, forwardRef } from "react";
import { ImageResizer } from "./extensions/image-resize";
import { TableMenu } from "./table-menu";

export interface ITipTapRichTextEditor {
  value: string;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange?: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  workspaceSlug: string;
  editable?: boolean;
  forwardedRef?: any;
  debouncedUpdatesEnabled?: boolean;
}

const Tiptap = (props: ITipTapRichTextEditor) => {
  const {
    onChange,
    debouncedUpdatesEnabled,
    forwardedRef,
    editable,
    setIsSubmitting,
    setShouldShowAlert,
    editorContentCustomClassNames,
    value,
    noBorder,
    workspaceSlug,
    borderOnFocus,
    customClassName,
  } = props;

  const editor = useEditor({
    editable: editable ?? true,
    editorProps: TiptapEditorProps(workspaceSlug, setIsSubmitting),
    extensions: TiptapExtensions(workspaceSlug, setIsSubmitting),
    content: value,
    onUpdate: async ({ editor }) => {
      // for instant feedback loop
      setIsSubmitting?.("submitting");
      setShouldShowAlert?.(true);
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

  const debouncedUpdates = useDebouncedCallback(async ({ onChange, editor }) => {
    setTimeout(async () => {
      if (onChange) {
        onChange(editor.getJSON(), editor.getHTML());
      }
    }, 500);
  }, 1000);

  const editorClassNames = `relative w-full max-w-full sm:rounded-lg mt-2 p-3 relative focus:outline-none rounded-md
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
        <TableMenu editor={editor} />
        {editor?.isActive("image") && <ImageResizer editor={editor} />}
      </div>
    </div>
  );
};

const TipTapEditor = forwardRef<ITipTapRichTextEditor, ITipTapRichTextEditor>((props, ref) => (
  <Tiptap {...props} forwardedRef={ref} />
));

TipTapEditor.displayName = "TipTapEditor";

export { TipTapEditor };
