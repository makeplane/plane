import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane ui
import { Loader } from "@plane/ui";
// components
import { RichTextReadOnlyEditor } from "@/components/editor";
// local types
import { TVersionEditorProps } from ".";

export const IssueVersionEditor: React.FC<TVersionEditorProps> = observer((props) => {
  const { activeVersion, currentVersionDescription, isCurrentVersionActive, versionDetails } = props;
  // params
  const { workspaceSlug, projectId } = useParams();

  if (!isCurrentVersionActive && !versionDetails)
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

  const description = isCurrentVersionActive ? currentVersionDescription : versionDetails?.description_html;
  if (description === undefined || description?.trim() === "") return null;

  return (
    <RichTextReadOnlyEditor
      id={activeVersion ?? ""}
      initialValue={description ?? "<p></p>"}
      containerClassName="p-0 pb-64 border-none"
      editorClassName="pl-10"
      workspaceSlug={workspaceSlug?.toString() ?? ""}
      projectId={projectId?.toString() ?? ""}
    />
  );
});
