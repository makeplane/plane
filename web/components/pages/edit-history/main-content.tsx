import { useRef } from "react";
// editor
import { DocumentReadOnlyEditorWithRef, EditorRefApi } from "@plane/document-editor";
// hooks
import { useMention } from "@/hooks/store";

type Props = {
  projectId: string;
  workspaceSlug: string;
};

export const PageEditHistoryMainContent: React.FC<Props> = (props) => {
  const { projectId, workspaceSlug } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { mentionHighlights } = useMention({
    workspaceSlug,
    projectId,
  });

  return (
    <DocumentReadOnlyEditorWithRef
      ref={editorRef}
      initialValue={"<p>Page edit history</p>"}
      containerClassName="p-5 pl-10 border-none"
      mentionHandler={{
        highlights: mentionHighlights,
      }}
    />
  );
};
