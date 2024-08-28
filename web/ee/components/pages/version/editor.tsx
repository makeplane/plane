import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane editor
import { DocumentReadOnlyEditorWithRef, TDisplayConfig } from "@plane/editor";
// plane types
import { IUserLite, TPageVersion } from "@plane/types";
// plane ui
import { Loader } from "@plane/ui";
// hooks
import { useMember, useUser } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { IssueEmbedCard } from "@/plane-web/components/pages";
// plane web hooks
import { useWorkspacePageDetails } from "@/plane-web/hooks/store";
import { useWorkspaceMention } from "@/plane-web/hooks/use-workspace-mention";

type Props = {
  activeVersion: string | null;
  isCurrentVersionActive: boolean;
  pageId: string;
  versionDetails: TPageVersion | undefined;
};

export const PagesVersionEditor: React.FC<Props> = observer((props) => {
  const { activeVersion, isCurrentVersionActive, pageId, versionDetails } = props;
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getUserDetails,
    workspace: { workspaceMemberIds },
  } = useMember();
  const currentPageDetails = useWorkspacePageDetails(pageId);
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

  const description = isCurrentVersionActive ? currentPageDetails.description_html : versionDetails?.description_html;
  if (description === undefined || description?.trim() === "") return null;

  return (
    <DocumentReadOnlyEditorWithRef
      id={activeVersion ?? ""}
      initialValue={description ?? "<p></p>"}
      containerClassName="p-0 pb-64 border-none"
      displayConfig={displayConfig}
      editorClassName="pl-10"
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
