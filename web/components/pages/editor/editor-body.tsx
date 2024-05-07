import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Control, Controller } from "react-hook-form";
// document editor
import {
  DocumentEditorWithRef,
  DocumentReadOnlyEditorWithRef,
  EditorReadOnlyRefApi,
  EditorRefApi,
  IMarking,
} from "@plane/document-editor";
// types
import { IUserLite, TPage } from "@plane/types";
// components
import { PageContentBrowser, PageContentLoader, PageEditorTitle } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember, useMention, useUser, useWorkspace } from "@/hooks/store";
import { usePageFilters } from "@/hooks/use-page-filters";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// services
import { FileService } from "@/services/file.service";
// store
import { IPageStore } from "@/store/pages/page.store";

const fileService = new FileService();

type Props = {
  control: Control<TPage, any>;
  editorRef: React.RefObject<EditorRefApi>;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  swrPageDetails: TPage | undefined;
  handleSubmit: () => void;
  markings: IMarking[];
  pageStore: IPageStore;
  sidePeekVisible: boolean;
  handleEditorReady: (value: boolean) => void;
  handleReadOnlyEditorReady: (value: boolean) => void;
  updateMarkings: (description_html: string) => void;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const {
    control,
    handleReadOnlyEditorReady,
    handleEditorReady,
    editorRef,
    markings,
    readOnlyEditorRef,
    handleSubmit,
    pageStore,
    swrPageDetails,
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
  const pageTitle = pageStore?.name ?? "";
  const pageDescription = pageStore?.description_html;
  const { description_html, isContentEditable, updateTitle, isSubmitting, setIsSubmitting } = pageStore;
  const projectMemberIds = projectId ? getProjectMemberIds(projectId.toString()) : [];
  const projectMemberDetails = projectMemberIds?.map((id) => getUserDetails(id) as IUserLite);
  // use-mention
  const { mentionHighlights, mentionSuggestions } = useMention({
    workspaceSlug: workspaceSlug?.toString() ?? "",
    projectId: projectId?.toString() ?? "",
    members: projectMemberDetails,
    user: currentUser ?? undefined,
  });
  // page filters
  const { isFullWidth } = usePageFilters();

  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    updateMarkings(description_html ?? "<p></p>");
  }, [description_html, updateMarkings]);

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
            <Controller
              name="description_html"
              control={control}
              render={({ field: { onChange } }) => (
                <DocumentEditorWithRef
                  fileHandler={{
                    cancel: fileService.cancelUpload,
                    delete: fileService.getDeleteImageFunction(workspaceId),
                    restore: fileService.getRestoreImageFunction(workspaceId),
                    upload: fileService.getUploadFileFunction(workspaceSlug as string, setIsSubmitting),
                  }}
                  handleEditorReady={handleEditorReady}
                  initialValue={pageDescription ?? "<p></p>"}
                  value={swrPageDetails?.description_html ?? "<p></p>"}
                  ref={editorRef}
                  containerClassName="p-0 pb-64"
                  editorClassName="lg:px-10 pl-8"
                  onChange={(_description_json, description_html) => {
                    setIsSubmitting("submitting");
                    setShowAlert(true);
                    onChange(description_html);
                    handleSubmit();
                  }}
                  mentionHandler={{
                    highlights: mentionHighlights,
                    suggestions: mentionSuggestions,
                  }}
                />
              )}
            />
          ) : (
            <DocumentReadOnlyEditorWithRef
              ref={readOnlyEditorRef}
              initialValue={pageDescription ?? "<p></p>"}
              handleEditorReady={handleReadOnlyEditorReady}
              containerClassName="p-0 pb-64 border-none"
              editorClassName="lg:px-10 pl-8"
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
