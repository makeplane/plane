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
import { PageContentBrowser, PageEditorTitle } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember, useMention, useUser, useWorkspace } from "@/hooks/store";
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
  const { currentUser } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const workspaceId = workspaceSlug ? getWorkspaceBySlug(workspaceSlug.toString())?.id ?? "" : "";
  const pageTitle = pageStore?.name ?? "";
  const pageDescription = pageStore?.description_html ?? "<p></p>";
  const isFullWidth = !!pageStore?.view_props?.full_width;
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

  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    updateMarkings(description_html ?? "<p></p>");
  }, [description_html, updateMarkings]);

  return (
    <div className="flex items-center h-full w-full overflow-y-auto">
      <div
        className={cn("sticky top-0 hidden h-full flex-shrink-0 -translate-x-full p-5 duration-200 md:block", {
          "translate-x-0": sidePeekVisible,
          "w-56 lg:w-72": !isFullWidth,
          "w-[10%]": isFullWidth,
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
          "md:w-[calc(100%-14rem)] lg:w-[calc(100%-18rem-18rem)]": !isFullWidth,
          "w-[80%]": isFullWidth,
        })}
      >
        <div className="h-full w-full flex flex-col gap-y-7 overflow-y-auto overflow-x-hidden">
          <div className="relative w-full flex-shrink-0 pl-5">
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
                  initialValue={pageDescription}
                  value={swrPageDetails?.description_html ?? "<p></p>"}
                  ref={editorRef}
                  containerClassName="p-0 pb-64"
                  editorClassName="px-10"
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
              initialValue={pageDescription}
              handleEditorReady={handleReadOnlyEditorReady}
              containerClassName="p-0 pb-64 border-none"
              editorClassName="px-10"
              mentionHandler={{
                highlights: mentionHighlights,
              }}
            />
          )}
        </div>
      </div>
      <div
        className={cn("hidden lg:block h-full flex-shrink-0", {
          "w-56 lg:w-72": !isFullWidth,
          "w-[10%]": isFullWidth,
        })}
      />
    </div>
  );
});
