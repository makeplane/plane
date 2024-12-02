import { EditorWrapper } from "./components/editor/editor-wrapper";
import { TEditorVariant } from "@/types/editor";
import useQueryParams from "./hooks/use-query-params";
import { MobileDocumentEditor } from "./components/document-editor/document-editor";

declare global {
  interface Window {
    flutter_inappwebview: any;
  }
}

function App() {
  const { variant } = useQueryParams(["variant"]);

  if (!variant || !Object.keys(TEditorVariant).includes(variant)) return null;

  if (variant === TEditorVariant.document) return <MobileDocumentEditor />;

  return <EditorWrapper variant={variant as TEditorVariant} />;
}

export default App;
