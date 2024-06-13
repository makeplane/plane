import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// document-editor
import {
  DocumentEditorWithRef,
  DocumentReadOnlyEditorWithRef,
  EditorReadOnlyRefApi,
  EditorRefApi,
  IMarking,
} from "@plane/document-editor";
// types
import { IUserLite } from "@plane/types";
// components
import { PageContentBrowser, PageEditorTitle, PageContentLoader } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember, useMention, useUser, useWorkspace } from "@/hooks/store";
import { useIssueEmbed } from "@/hooks/use-issue-embed";
import { usePageDescription } from "@/hooks/use-page-description";
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web components
import { IssueEmbedCard } from "@/plane-web/components/pages";
// services
import { FileService } from "@/services/file.service";
// store
import { IPage } from "@/store/pages/page";

const fileService = new FileService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  markings: IMarking[];
  page: IPage;
  sidePeekVisible: boolean;
  handleEditorReady: (value: boolean) => void;
  handleReadOnlyEditorReady: (value: boolean) => void;
  updateMarkings: (description_html: string) => void;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const {
    handleReadOnlyEditorReady,
    handleEditorReady,
    editorRef,
    markings,
    readOnlyEditorRef,
    page,
    sidePeekVisible,
    updateMarkings,
  } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const workspaceId = workspaceSlug ? getWorkspaceBySlug(workspaceSlug.toString())?.id ?? "" : "";
  const pageId = page?.id;
  const pageTitle = page?.name ?? "";
  const pageDescription = page?.description_html;
  const { isContentEditable, updateTitle, setIsSubmitting } = page;
  const projectMemberIds = projectId ? getProjectMemberIds(projectId.toString()) : [];
  const projectMemberDetails = projectMemberIds?.map((id) => getUserDetails(id) as IUserLite);
  // project-description
  const { handleDescriptionChange, isDescriptionReady, pageDescriptionYJS } = usePageDescription({
    editorRef,
    page,
    projectId,
    workspaceSlug,
  });
  // use-mention
  const { mentionHighlights, mentionSuggestions } = useMention({
    workspaceSlug: workspaceSlug?.toString() ?? "",
    projectId: projectId?.toString() ?? "",
    members: projectMemberDetails,
    user: currentUser ?? undefined,
  });

  // page filters
  const { isFullWidth } = usePageFilters();
  // issue-embed
  const { fetchIssues } = useIssueEmbed(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "");

  useEffect(() => {
    updateMarkings(pageDescription ?? "<p></p>");
  }, [pageDescription, updateMarkings]);

  if (pageId === undefined || !pageDescriptionYJS || !isDescriptionReady) return <PageContentLoader />;

  const handleIssueSearch = async (searchQuery: string) => {
    const response = await fetchIssues(searchQuery);
    return response;
  };

  if (pageDescription === undefined) return <PageContentLoader />;

  return (
    <div className="flex items-center h-full w-full overflow-y-auto">
      <div
        className={cn("sticky top-0 hidden h-full flex-shrink-0 -translate-x-full p-5 duration-200 md:block", {
          "translate-x-0": sidePeekVisible,
          "w-40 lg:w-56": !isFullWidth,
          "w-[5%]": isFullWidth,
        })}
      >
        {!isFullWidth && (
          <PageContentBrowser
            editorRef={(isContentEditable ? editorRef : readOnlyEditorRef)?.current}
            markings={markings}
          />
        )}
      </div>
      <div
        className={cn("h-full w-full pt-5", {
          "md:w-[calc(100%-10rem)] xl:w-[calc(100%-14rem-14rem)]": !isFullWidth,
          "md:w-[90%]": isFullWidth,
        })}
      >
        <div className="h-full w-full flex flex-col gap-y-7 overflow-y-auto overflow-x-hidden">
          <div className="relative w-full flex-shrink-0 md:pl-5 px-4">
            <PageEditorTitle
              editorRef={editorRef}
              title={pageTitle}
              updateTitle={updateTitle}
              readOnly={!isContentEditable}
            />
          </div>
          {isContentEditable ? (
            <DocumentEditorWithRef
              id={pageId}
              fileHandler={{
                cancel: fileService.cancelUpload,
                delete: fileService.getDeleteImageFunction(workspaceId),
                restore: fileService.getRestoreImageFunction(workspaceId),
                upload: fileService.getUploadFileFunction(workspaceSlug as string, setIsSubmitting),
              }}
              handleEditorReady={handleEditorReady}
              value={pageDescriptionYJS}
              ref={editorRef}
              containerClassName="p-0 pb-64"
              editorClassName="pl-10"
              onChange={handleDescriptionChange}
              mentionHandler={{
                highlights: mentionHighlights,
                suggestions: mentionSuggestions,
              }}
              embedHandler={{
                issue: {
                  searchCallback: async (query) =>
                    new Promise((resolve) => {
                      setTimeout(async () => {
                        const response = await handleIssueSearch(query);
                        const issueItemsWithIdentifiers = response?.map((issue) => ({
                          ...issue,
                          projectId: projectId.toString(),
                          workspaceSlug: workspaceSlug.toString(),
                        }));
                        resolve(issueItemsWithIdentifiers);
                      }, 300);
                    }),
                  widgetCallback: ({
                    issueId,
                    projectId: projectIdFromEmbed,
                    workspaceSlug: workspaceSlugFromEmbed,
                  }) => {
                    const resolvedProjectId = projectIdFromEmbed ?? projectId?.toString() ?? "";
                    const resolvedWorkspaceSlug = workspaceSlugFromEmbed ?? workspaceSlug?.toString() ?? "";
                    return (
                      <IssueEmbedCard
                        issueId={issueId}
                        projectId={resolvedProjectId}
                        workspaceSlug={resolvedWorkspaceSlug}
                      />
                    );
                  },
                },
              }}
            />
          ) : (
            <DocumentReadOnlyEditorWithRef
              ref={readOnlyEditorRef}
              initialValue={pageDescription ?? "<p></p>"}
              handleEditorReady={handleReadOnlyEditorReady}
              containerClassName="p-0 pb-64 border-none"
              editorClassName="pl-10"
              mentionHandler={{
                highlights: mentionHighlights,
              }}
              embedHandler={{
                issue: {
                  widgetCallback: ({
                    issueId,
                    projectId: projectIdFromEmbed,
                    workspaceSlug: workspaceSlugFromEmbed,
                  }) => {
                    const resolvedProjectId = projectIdFromEmbed ?? projectId?.toString() ?? "";
                    const resolvedWorkspaceSlug = workspaceSlugFromEmbed ?? workspaceSlug?.toString() ?? "";

                    return (
                      <IssueEmbedCard
                        issueId={issueId}
                        projectId={resolvedProjectId}
                        workspaceSlug={resolvedWorkspaceSlug}
                      />
                    );
                  },
                },
              }}
            />
          )}
        </div>
      </div>
      <div
        className={cn("hidden xl:block flex-shrink-0", {
          "w-40 lg:w-56": !isFullWidth,
          "w-[5%]": isFullWidth,
        })}
      />
    </div>
  );
});
