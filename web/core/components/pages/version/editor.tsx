import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane editor
import { DocumentReadOnlyEditorWithRef, TDisplayConfig } from "@plane/editor";
// plane types
import { IUserLite, TPageVersion } from "@plane/types";
// plane ui
import { Loader } from "@plane/ui";
// hooks
import { useMember, useMention, useUser } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web hooks
import { useIssueEmbed } from "@/plane-web/hooks/use-issue-embed";

export type TVersionEditorProps = {
  activeVersion: string | null;
  currentVersionDescription: string | null;
  isCurrentVersionActive: boolean;
  versionDetails: TPageVersion | undefined;
};

export const PagesVersionEditor: React.FC<TVersionEditorProps> = observer((props) => {
  const { activeVersion, currentVersionDescription, isCurrentVersionActive, versionDetails } = props;
  // params
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const projectMemberIds = projectId ? getProjectMemberIds(projectId.toString()) : [];
  const projectMemberDetails = projectMemberIds?.map((id) => getUserDetails(id) as IUserLite);
  // issue-embed
  const { issueEmbedProps } = useIssueEmbed(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "");
  // use-mention
  const { mentionHighlights } = useMention({
    workspaceSlug: workspaceSlug?.toString() ?? "",
    projectId: projectId?.toString() ?? "",
    members: projectMemberDetails,
    user: currentUser ?? undefined,
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
      displayConfig={displayConfig}
      editorClassName="pl-10"
      mentionHandler={{
        highlights: mentionHighlights,
      }}
      embedHandler={{
        issue: {
          widgetCallback: issueEmbedProps.widgetCallback,
        },
      }}
    />
  );
});
