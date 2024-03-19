import { ReactElement, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { Controller, useForm } from "react-hook-form";
import useSWR from "swr";
// hooks
import { usePage, useUser, useWorkspace } from "hooks/store";
import { useProjectPages } from "hooks/store/use-project-specific-pages";
import useReloadConfirmations from "hooks/use-reload-confirmation";
// services
import { FileService } from "services/file.service";
// layouts
import { AppLayout } from "layouts/app-layout";
import { NextPageWithLayout } from "lib/types";
// components
import {
  DocumentEditorWithRef,
  DocumentReadOnlyEditorWithRef,
  EditorRefApi,
  useEditorMarkings,
} from "@plane/document-editor";
import { PageDetailsHeader } from "components/headers/page-details";
import { IssuePeekOverview } from "components/issues";
// ui
import { Spinner, TOAST_TYPE, setToast } from "@plane/ui";
import { PageHead } from "components/core";
// types
import { IPage } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { PageContentBrowser, PageEditorHeaderRoot } from "components/pages";

// services
const fileService = new FileService();

const PageDetailsPage: NextPageWithLayout = observer(() => {
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;
  const workspaceStore = useWorkspace();
  const workspaceId = workspaceStore.getWorkspaceBySlug(workspaceSlug as string)?.id as string;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { projectPageMap, projectArchivedPageMap, fetchProjectPages, fetchArchivedProjectPages } = useProjectPages();
  // form info
  const { handleSubmit, getValues, control, reset } = useForm<IPage>({
    defaultValues: {
      name: "",
      description_html: "",
    },
  });
  // editor markings hook
  const { markings } = useEditorMarkings();
  useSWR(
    workspaceSlug && projectId ? `ALL_PAGES_LIST_${projectId}` : null,
    workspaceSlug && projectId && !projectPageMap[projectId as string] && !projectArchivedPageMap[projectId as string]
      ? () => fetchProjectPages(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetching archived pages from API
  useSWR(
    workspaceSlug && projectId ? `ALL_ARCHIVED_PAGES_LIST_${projectId}` : null,
    workspaceSlug && projectId && !projectArchivedPageMap[projectId as string] && !projectPageMap[projectId as string]
      ? () => fetchArchivedProjectPages(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const pageStore = usePage(pageId as string);

  const { setShowAlert } = useReloadConfirmations(pageStore?.isSubmitting === "submitting");

  useEffect(
    () => () => {
      if (pageStore) pageStore.cleanup();
    },
    [pageStore]
  );

  if (!pageStore)
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );

  // We need to get the values of title and description from the page store but we don't have to subscribe to those values
  const pageTitle = pageStore?.name;
  const pageDescription = pageStore?.description_html;
  const {
    updateName: updateNameAction,
    updateDescription: updateDescriptionAction,
    id: pageIdMobx,
    isSubmitting,
    setIsSubmitting,
    is_locked,
    archived_at,
    created_at,
    created_by,
    updated_at,
    updated_by,
  } = pageStore;

  const updatePage = async (formData: IPage) => {
    if (!workspaceSlug || !projectId || !pageId) return;
    updateDescriptionAction(formData.description_html);
  };

  const actionCompleteAlert = ({
    title,
    message,
    type,
  }: {
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }) => {
    setToast({
      title,
      message,
      type: type as TOAST_TYPE,
    });
  };

  const updatePageTitle = (title: string) => {
    if (!workspaceSlug || !projectId || !pageId) return;
    updateNameAction(title);
  };
  // auth
  const isPageReadOnly =
    is_locked ||
    archived_at ||
    (currentProjectRole && [EUserProjectRoles.VIEWER, EUserProjectRoles.GUEST].includes(currentProjectRole));

  return pageIdMobx ? (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col justify-between">
        <div className="h-full w-full flex-shrink-0 flex flex-col overflow-hidden">
          {editorRef.current && projectId && (
            <PageEditorHeaderRoot
              editorRef={editorRef.current}
              pageStore={pageStore}
              projectId={projectId.toString()}
            />
          )}
          <div className="flex items-center h-full w-full overflow-y-auto">
            {editorRef.current && (
              <div className="sticky top-0 h-full flex-shrink-0 w-56 lg:w-72 hidden md:block p-5">
                <PageContentBrowser editorRef={editorRef.current} markings={markings} />
              </div>
            )}
            <div className="h-full w-full md:w-[calc(100%-14rem)] lg:w-[calc(100%-18rem-18rem)]">
              {isPageReadOnly ? (
                <DocumentReadOnlyEditorWithRef
                  onActionCompleteHandler={actionCompleteAlert}
                  ref={editorRef}
                  value={pageDescription}
                  customClassName={"tracking-tight w-full px-0"}
                  borderOnFocus={false}
                  noBorder
                  documentDetails={{
                    title: pageTitle,
                    created_by: created_by,
                    created_on: created_at,
                    last_updated_at: updated_at,
                    last_updated_by: updated_by,
                  }}
                />
              ) : (
                <Controller
                  name="description_html"
                  control={control}
                  render={({ field: { onChange } }) => (
                    <DocumentEditorWithRef
                      isSubmitting={isSubmitting}
                      documentDetails={{
                        title: pageTitle,
                        created_by: created_by,
                        created_on: created_at,
                        last_updated_at: updated_at,
                        last_updated_by: updated_by,
                      }}
                      uploadFile={fileService.getUploadFileFunction(workspaceSlug as string, setIsSubmitting)}
                      deleteFile={fileService.getDeleteImageFunction(workspaceId)}
                      restoreFile={fileService.getRestoreImageFunction(workspaceId)}
                      value={pageDescription}
                      cancelUploadImage={fileService.cancelUpload}
                      ref={editorRef}
                      updatePageTitle={updatePageTitle}
                      onActionCompleteHandler={actionCompleteAlert}
                      customClassName="tracking-tight self-center h-full w-full right-[0.675rem]"
                      onChange={(_description_json, description_html) => {
                        setIsSubmitting("submitting");
                        setShowAlert(true);
                        onChange(description_html);
                        handleSubmit(updatePage)();
                      }}
                    />
                  )}
                />
              )}
            </div>
            <div className="h-full w-56 lg:w-72 flex-shrink-0 hidden lg:block" />
          </div>
          <IssuePeekOverview />
        </div>
      </div>
    </>
  ) : (
    <div className="grid h-full w-full place-items-center">
      <Spinner />
    </div>
  );
});

PageDetailsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<PageDetailsHeader />} withProjectWrapper>
      {page}
    </AppLayout>
  );
};

export default PageDetailsPage;
