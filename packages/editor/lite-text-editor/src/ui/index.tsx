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
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange?: (json: object, html: string) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  onEnterKeyPress?: (e?: any) => void;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions?: () => Promise<IMentionSuggestion[]>;
  };
  tabIndex?: number;
}

const LiteTextEditor = (props: ILiteTextEditor) => {
  const {
    onChange,
    editorContentCustomClassNames,
    initialValue,
    fileHandler,
    value,
    customClassName,
    forwardedRef,
    onEnterKeyPress,
    tabIndex,
    mentionHandler,
  } = props;

  const editor = useEditor({
    onChange,
    initialValue,
    value,
    restoreFile: fileHandler.restore,
    uploadFile: fileHandler.upload,
    deleteFile: fileHandler.delete,
    cancelUploadImage: fileHandler.cancel,
    forwardedRef,
    extensions: LiteTextEditorExtensions(onEnterKeyPress),
    mentionHandler,
  });

  const editorClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    customClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorClassNames={editorClassNames}>
      <div className="flex flex-col">
        <EditorContentWrapper
          tabIndex={tabIndex}
          editor={editor}
          editorContentCustomClassNames={editorContentCustomClassNames}
        />
      </div>
    </EditorContainer>
  );
};

const LiteTextEditorWithRef = React.forwardRef<EditorRefApi, ILiteTextEditor>((props, ref) => (
  <LiteTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

export { LiteTextEditor, LiteTextEditorWithRef };
