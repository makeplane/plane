import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
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
import { PageContentBrowser, PageContentLoader, PageEditorTitle } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember, useMention, useUser, useWorkspace } from "@/hooks/store";
import { usePageDescription } from "@/hooks/use-page-description";
import { usePageFilters } from "@/hooks/use-page-filters";
// services
import { FileService } from "@/services/file.service";
// store
import { IPageStore } from "@/store/pages/page.store";

const fileService = new FileService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  markings: IMarking[];
  page: IPageStore;
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
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
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

  useEffect(() => {
    updateMarkings(pageDescription ?? "<p></p>");
  }, [pageDescription, updateMarkings]);

  if (pageId === undefined || !pageDescriptionYJS || !isDescriptionReady) return <PageContentLoader />;

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
