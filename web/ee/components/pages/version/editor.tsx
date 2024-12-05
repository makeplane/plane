import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane editor
import { DocumentReadOnlyEditorWithRef, TDisplayConfig } from "@plane/editor";
// plane types
import { IUserLite } from "@plane/types";
// plane ui
import { Loader } from "@plane/ui";
// components
import { TVersionEditorProps } from "@/components/pages";
// helpers
import { getReadOnlyEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMember, useUser } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { IssueEmbedCard } from "@/plane-web/components/pages";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useWorkspaceMention } from "@/plane-web/hooks/use-workspace-mention";

export const WorkspacePagesVersionEditor: React.FC<TVersionEditorProps> = observer((props) => {
  const { activeVersion, currentVersionDescription, isCurrentVersionActive, versionDetails } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getUserDetails,
    workspace: { workspaceMemberIds },
  } = useMember();
  const { documentEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString() ?? "");
  // derived values
  const workspaceMemberDetails = workspaceMemberIds?.map((id) => getUserDetails(id) as IUserLite);
  // use-mention
  const { mentionHighlights } = useWorkspaceMention({
    workspaceSlug: workspaceSlug?.toString() ?? "",
    members: workspaceMemberDetails,
    user: currentUser,
  });
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
      displayConfig={displayConfig}
      editorClassName="pl-10"
      fileHandler={getReadOnlyEditorFileHandlers({
        workspaceSlug: workspaceSlug?.toString() ?? "",
      })}
      mentionHandler={{
        highlights: mentionHighlights,
      }}
      embedHandler={{
        issue: {
          widgetCallback: ({ issueId, projectId: projectIdFromEmbed, workspaceSlug: workspaceSlugFromEmbed }) => {
            const resolvedProjectId = projectIdFromEmbed ?? "";
            const resolvedWorkspaceSlug = workspaceSlugFromEmbed ?? workspaceSlug?.toString() ?? "";
            return (
              <IssueEmbedCard issueId={issueId} projectId={resolvedProjectId} workspaceSlug={resolvedWorkspaceSlug} />
            );
          },
        },
      }}
    />
  );
});
