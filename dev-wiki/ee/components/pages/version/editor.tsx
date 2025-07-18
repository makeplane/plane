import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane editor
import { DocumentReadOnlyEditorWithRef, TDisplayConfig } from "@plane/editor";
// plane ui
import { Loader } from "@plane/ui";
// components
import { EditorMentionsRoot } from "@/components/editor";
import { TVersionEditorProps } from "@/components/pages";
// hooks
import { useEditorConfig } from "@/hooks/editor";
import { useWorkspace } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
// import { IssueEmbedCard } from "@/plane-web/components/pages";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";

export const WorkspacePagesVersionEditor: React.FC<TVersionEditorProps> = observer((props) => {
  const { activeVersion, currentVersionDescription, isCurrentVersionActive, versionDetails } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug?.toString() ?? "");
  // editor config
  const { getReadOnlyEditorFileHandlers } = useEditorConfig();
  // editor flagging
  const { documentEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString() ?? "");
  // page filters
  const { fontSize, fontStyle } = usePageFilters();

  const displayConfig: TDisplayConfig = {
    fontSize,
    fontStyle,
  };

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
    <DocumentReadOnlyEditorWithRef
      id={activeVersion ?? ""}
      initialValue={description ?? "<p></p>"}
      containerClassName="p-0 pb-64 border-none"
      disabledExtensions={disabledExtensions}
      flaggedExtensions={[]}
      displayConfig={displayConfig}
      editorClassName="pl-10"
      fileHandler={getReadOnlyEditorFileHandlers({
        workspaceId: workspaceDetails?.id ?? "",
        workspaceSlug: workspaceSlug?.toString() ?? "",
      })}
      mentionHandler={{
        renderComponent: (props) => <EditorMentionsRoot {...props} />,
      }}
      embedHandler={{
        issue: {
          widgetCallback: ({ issueId, projectId: projectIdFromEmbed, workspaceSlug: workspaceSlugFromEmbed }) => {
            const resolvedProjectId = projectIdFromEmbed ?? "";
            const resolvedWorkspaceSlug = workspaceSlugFromEmbed ?? workspaceSlug?.toString() ?? "";
            return null;
            // return (
            //   // <IssueEmbedCard issueId={issueId} projectId={resolvedProjectId} workspaceSlug={resolvedWorkspaceSlug} />
            // );
          },
        },
      }}
    />
  );
});
