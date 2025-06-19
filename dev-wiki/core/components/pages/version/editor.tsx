import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane editor
import { DocumentReadOnlyEditorWithRef, TDisplayConfig } from "@plane/editor";
// plane types
import { TPage, TPageVersion } from "@plane/types";
// plane ui
import { Loader } from "@plane/ui";
// components
import { EditorMentionsRoot } from "@/components/editor";
// hooks
import { useEditorConfig } from "@/hooks/editor";
import { useMember, useWorkspace } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
import { EPageStoreType } from "@/plane-web/hooks/store/use-page-store";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { PageEmbedCardRoot } from "@/plane-web/components/pages";
// import { useIssueEmbed } from "@/plane-web/hooks/use-issue-embed";

export type TVersionEditorProps = {
  activeVersion: string | null;
  currentVersionDescription: string | null;
  isCurrentVersionActive: boolean;
  versionDetails: TPageVersion | undefined;
  storeType: EPageStoreType;
};

export const PagesVersionEditor: React.FC<TVersionEditorProps> = observer((props) => {
  const { activeVersion, currentVersionDescription, isCurrentVersionActive, versionDetails, storeType } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // params
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceDetails = getWorkspaceBySlug(workspaceSlug?.toString() ?? "");
  // editor flaggings
  const { documentEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString() ?? "");
  // editor config
  const { getReadOnlyEditorFileHandlers } = useEditorConfig();
  // issue-embed
  // const { issueEmbedProps } = useIssueEmbed({
  //   projectId: projectId?.toString() ?? "",
  //   workspaceSlug: workspaceSlug?.toString() ?? "",
  // });
  // page filters
  const { fontSize, fontStyle } = usePageFilters();

  const displayConfig: TDisplayConfig = {
    fontSize,
    fontStyle,
    wideLayout: true,
  };

  const subPagesDetails = useMemo(
    () => (versionDetails?.sub_pages_data ? (versionDetails.sub_pages_data as TPage[]) : []),
    [versionDetails?.sub_pages_data]
  );

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
      key={activeVersion ?? ""}
      id={activeVersion ?? ""}
      initialValue={description ?? "<p></p>"}
      containerClassName="p-0 pb-64 border-none"
      disabledExtensions={disabledExtensions}
      displayConfig={displayConfig}
      editorClassName="pl-10"
      fileHandler={getReadOnlyEditorFileHandlers({
        projectId: projectId?.toString() ?? "",
        workspaceId: workspaceDetails?.id ?? "",
        workspaceSlug: workspaceSlug?.toString() ?? "",
      })}
      mentionHandler={{
        renderComponent: (props) => <EditorMentionsRoot {...props} />,
        getMentionedEntityDetails: (id: string) => ({ display_name: getUserDetails(id)?.display_name ?? "" }),
      }}
      embedHandler={{
        // issue: {
        //   widgetCallback: issueEmbedProps.widgetCallback,
        // },
        page: {
          widgetCallback: ({ pageId: pageIdFromNode }) => {
            const pageDetails = subPagesDetails.find((page) => page.id === pageIdFromNode);
            return (
              <PageEmbedCardRoot
                embedPageId={pageIdFromNode}
                previewDisabled
                storeType={storeType}
                pageDetails={pageDetails}
                isDroppable={false}
              />
            );
          },
          workspaceSlug: workspaceSlug.toString(),
        },
      }}
    />
  );
});
