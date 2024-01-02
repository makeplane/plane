import * as React from "react";
import {
  UploadImage,
  DeleteImage,
  IMentionSuggestion,
  RestoreImage,
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  useEditor,
} from "@plane/editor-core";
import { FixedMenu } from "src/ui/menus/fixed-menu";
import { LiteTextEditorExtensions } from "src/ui/extensions";

interface ILiteTextEditor {
  value: string;
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  restoreFile: RestoreImage;

  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange?: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  forwardedRef?: any;
  debouncedUpdatesEnabled?: boolean;
  commentAccessSpecifier?: {
    accessValue: string;
    onAccessChange: (accessKey: string) => void;
    showAccessSpecifier: boolean;
    commentAccess: {
      icon: any;
      key: string;
      label: "Private" | "Public";
    }[];
  };
  onEnterKeyPress?: (e?: any) => void;
  cancelUploadImage?: () => any;
  mentionHighlights?: string[];
  mentionSuggestions?: IMentionSuggestion[];
  submitButton?: React.ReactNode;
}

interface LiteTextEditorProps extends ILiteTextEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

const LiteTextEditor = (props: LiteTextEditorProps) => {
  const {
    onChange,
    cancelUploadImage,
    debouncedUpdatesEnabled,
    setIsSubmitting,
    setShouldShowAlert,
    editorContentCustomClassNames,
    value,
    uploadFile,
    deleteFile,
    restoreFile,
    noBorder,
    borderOnFocus,
    customClassName,
    forwardedRef,
    commentAccessSpecifier,
    onEnterKeyPress,
    mentionHighlights,
    mentionSuggestions,
    submitButton,
  } = props;

  const editor = useEditor({
    onChange,
    cancelUploadImage,
    debouncedUpdatesEnabled,
    setIsSubmitting,
    setShouldShowAlert,
    value,
    uploadFile,
    deleteFile,
    restoreFile,
    forwardedRef,
    extensions: LiteTextEditorExtensions(onEnterKeyPress),
    mentionHighlights,
    mentionSuggestions,
  });

  const editorClassNames = getEditorClassNames({
    noBorder,
    borderOnFocus,
    customClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorClassNames={editorClassNames}>
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
        <div className="mt-4 w-full">
          <FixedMenu
            editor={editor}
            uploadFile={uploadFile}
            setIsSubmitting={setIsSubmitting}
            commentAccessSpecifier={commentAccessSpecifier}
            submitButton={submitButton}
          />
        </div>
      </div>
    </EditorContainer>
  );
};

const LiteTextEditorWithRef = React.forwardRef<EditorHandle, ILiteTextEditor>((props, ref) => (
  <LiteTextEditor {...props} forwardedRef={ref} />
));

LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

export { LiteTextEditor, LiteTextEditorWithRef };
