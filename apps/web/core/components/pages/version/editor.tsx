import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TDisplayConfig } from "@plane/editor";
import { TPageVersion } from "@plane/types";
import { Loader } from "@plane/ui";
// components
import { DocumentEditor } from "@/components/editor/document/editor";
// hooks
import { useWorkspace } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";

export type TVersionEditorProps = {
  activeVersion: string | null;
  versionDetails: TPageVersion | undefined;
};

export const PagesVersionEditor: React.FC<TVersionEditorProps> = observer((props) => {
  const { activeVersion, versionDetails } = props;
  // params
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug?.toString() ?? "");
  // page filters
  const { fontSize, fontStyle } = usePageFilters();

  const displayConfig: TDisplayConfig = {
    fontSize,
    fontStyle,
    wideLayout: true,
  };

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
      key={activeVersion ?? ""}
      editable={false}
      id={activeVersion ?? ""}
      value={description}
      containerClassName="p-0 pb-64 border-none"
      displayConfig={displayConfig}
      editorClassName="pl-10"
      projectId={projectId?.toString()}
      workspaceId={workspaceDetails?.id ?? ""}
      workspaceSlug={workspaceSlug?.toString() ?? ""}
    />
  );
});
