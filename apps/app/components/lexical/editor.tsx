import {
  EditorState,
  $getRoot,
  $getSelection,
  SerializedEditorState,
  LexicalEditor,
} from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS, CHECK_LIST } from "@lexical/markdown";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $generateHtmlFromNodes } from "@lexical/html";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";

// custom plugins
import { CodeHighlightPlugin } from "./plugins/code-highlight";
import { LexicalToolbar } from "./toolbar";
// config
import { initialConfig } from "./config";
// helpers
import { getValidatedValue } from "./helpers/editor";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

export interface RichTextEditorProps {
  onChange: (state: string) => void;
  id: string;
  value: string;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onChange,
  id,
  value,
  placeholder = "Enter some text...",
}) => {
  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      onChange(JSON.stringify(editorState.toJSON()));
    });
  };

  // function handleChange(state: EditorState, editor: LexicalEditor) {
  //   state.read(() => {
  //     onChange(state.toJSON());
  //   });
  // }

  return (
    <LexicalComposer
      initialConfig={{
        ...initialConfig,
        namespace: id || "Lexical Editor",
        editorState: getValidatedValue(value),
      }}
    >
      <div className="border border-[#e2e2e2] rounded-md">
        <LexicalToolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className='className="h-[450px] outline-none py-[15px] px-2.5 resize-none overflow-hidden text-ellipsis' />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={
              <div className="absolute top-4 left-3 pointer-events-none select-none text-gray-400">
                {placeholder}
              </div>
            }
          />
          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <CodeHighlightPlugin />
          <ListPlugin />
          <LinkPlugin />
          <CheckListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>
  );
};

export default RichTextEditor;
