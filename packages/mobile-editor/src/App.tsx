import { MobileDocumentEditor } from "@/components/document-editor/document-editor";
import { EditorWrapper } from "@/components/editor/editor-wrapper";
import useQueryParams from "@/hooks/use-query-params";
import { TEditorVariant } from "@/types/editor";

export const App = () => {
  const { variant } = useQueryParams(["variant"]);

  // If the variant is not valid, do not render the editor.
  if (!variant || !Object.keys(TEditorVariant).includes(variant)) return null;

  if (variant === TEditorVariant.document) return <MobileDocumentEditor />;

  return <EditorWrapper variant={variant as TEditorVariant} />;
};
