import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane editor
import type { TDisplayConfig } from "@plane/editor";
// plane ui
import { Loader } from "@plane/ui";
// components
import { DocumentEditor } from "@/components/editor/document/editor";
import type { TVersionEditorProps } from "@/components/pages/version/editor";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

export const WorkspacePagesVersionEditor: React.FC<TVersionEditorProps> = observer((props) => {
  const { activeVersion, versionDetails } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug?.toString() ?? "");
  // editor flagging
  const { document: documentEditorExtensions } = useEditorFlagging({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });
  // page filters
  const { fontSize, fontStyle } = usePageFilters();

  const displayConfig: TDisplayConfig = useMemo(
    () => ({
      fontSize,
      fontStyle,
    }),
    [fontSize, fontStyle]
  );

  if (!versionDetails)
    return (
      <div className="size-full px-5">
        <Loader className="relative space-y-4">
          <Loader.Item width="50%" height="36px" />
          <div className="space-y-2">
            <div className="py-2">
              <Loader.Item width="100%" height="36px" />
            </div>
            <Loader.Item width="80%" height="22px" />
            <div className="relative flex items-center gap-2">
              <Loader.Item width="30px" height="30px" />
              <Loader.Item width="30%" height="22px" />
            </div>
            <div className="py-2">
              <Loader.Item width="60%" height="36px" />
            </div>
            <Loader.Item width="70%" height="22px" />
            <Loader.Item width="30%" height="22px" />
            <div className="relative flex items-center gap-2">
              <Loader.Item width="30px" height="30px" />
              <Loader.Item width="30%" height="22px" />
            </div>
            <div className="py-2">
              <Loader.Item width="50%" height="30px" />
            </div>
            <Loader.Item width="100%" height="22px" />
            <div className="py-2">
              <Loader.Item width="30%" height="30px" />
            </div>
            <Loader.Item width="30%" height="22px" />
            <div className="relative flex items-center gap-2">
              <div className="py-2">
                <Loader.Item width="30px" height="30px" />
              </div>
              <Loader.Item width="30%" height="22px" />
            </div>
          </div>
        </Loader>
      </div>
    );

  const description = versionDetails?.description_json;
  if (!description) return null;

  return (
    <DocumentEditor
      editable={false}
      id={activeVersion ?? ""}
      value={description}
      containerClassName="p-0 pb-64 border-none"
      disabledExtensions={documentEditorExtensions.disabled}
      flaggedExtensions={documentEditorExtensions.flagged}
      displayConfig={displayConfig}
      editorClassName="pl-10"
      workspaceId={workspaceDetails?.id ?? ""}
      workspaceSlug={workspaceSlug?.toString() ?? ""}
    />
  );
});
