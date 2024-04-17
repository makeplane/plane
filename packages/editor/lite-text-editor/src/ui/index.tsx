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
  IMentionHighlight,
  EditorRefApi,
} from "@plane/editor-core";
import { LiteTextEditorExtensions } from "src/ui/extensions";

export interface ILiteTextEditor {
  initialValue: string;
  value?: string | null;
  fileHandler: {
    cancel: () => void;
    delete: DeleteImage;
    upload: UploadImage;
    restore: RestoreImage;
  };
  containerClassName?: string;
  editorClassName?: string;
  onChange?: (json: object, html: string) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  onEnterKeyPress?: (e?: any) => void;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions?: () => Promise<IMentionSuggestion[]>;
  };
  tabIndex?: number;
  placeholder?: string | ((isFocused: boolean) => string);
}

const LiteTextEditor = (props: ILiteTextEditor) => {
  const {
    onChange,
    initialValue,
    fileHandler,
    value,
    containerClassName,
    editorClassName = "",
    forwardedRef,
    onEnterKeyPress,
    tabIndex,
    mentionHandler,
    placeholder = "Add comment...",
  } = props;

  const editor = useEditor({
    onChange,
    initialValue,
    value,
    editorClassName,
    restoreFile: fileHandler.restore,
    uploadFile: fileHandler.upload,
    deleteFile: fileHandler.delete,
    cancelUploadImage: fileHandler.cancel,
    forwardedRef,
    extensions: LiteTextEditorExtensions(onEnterKeyPress),
    mentionHandler,
    placeholder,
    tabIndex,
  });

  const editorContainerClassName = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorContainerClassName={editorContainerClassName}>
      <div className="flex flex-col">
        <EditorContentWrapper tabIndex={tabIndex} editor={editor} />
      </div>
    </EditorContainer>
  );
};

const LiteTextEditorWithRef = React.forwardRef<EditorRefApi, ILiteTextEditor>((props, ref) => (
  <LiteTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

export { LiteTextEditor, LiteTextEditorWithRef };
