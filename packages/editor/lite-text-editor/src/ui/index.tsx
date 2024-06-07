import * as React from "react";
// editor-core
import {
  IMentionSuggestion,
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  useEditor,
  IMentionHighlight,
  EditorRefApi,
  TFileHandler,
} from "@plane/editor-core";
// extensions
import { LiteTextEditorExtensions } from "src/ui/extensions";

export interface ILiteTextEditor {
  initialValue: string;
  value?: string | null;
  fileHandler: TFileHandler;
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
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  id?: string;
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
    id = "",
  } = props;

  const editor = useEditor({
    onChange,
    initialValue,
    value,
    id,
    editorClassName,
    fileHandler,
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
