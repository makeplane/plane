import { FC } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
// custom plugins
import { CodeHighlightPlugin } from "./plugins/code-highlight";
import ReadOnlyPlugin from "./plugins/read-only";
// config
import { initialConfig } from "./config";
// helpers
import { getValidatedValue } from "./helpers/editor";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";

export interface RichTextViewerProps {
  id: string;
  value: string;
}

const RichTextViewer: FC<RichTextViewerProps> = (props) => {
  // props
  const { value, id } = props;

  return (
    <LexicalComposer
      initialConfig={{
        ...initialConfig,
        namespace: id || "Lexical Editor",
        editorState: getValidatedValue(value),
        editable: false,
      }}
    >
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className='className="h-[450px] outline-none py-[15px] resize-none overflow-hidden text-ellipsis' />
          }
          ErrorBoundary={LexicalErrorBoundary}
          placeholder={
            <div className="absolute top-[15px] left-[10px] pointer-events-none select-none text-gray-400">
              Enter some text...
            </div>
          }
        />
        <ReadOnlyPlugin value={value} />
        <HistoryPlugin />
        <CodeHighlightPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      </div>
    </LexicalComposer>
  );
};

export default RichTextViewer;
