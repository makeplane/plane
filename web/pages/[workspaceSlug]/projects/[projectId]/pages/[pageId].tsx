import { ReactElement, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import useSWR from "swr";
// hooks
import { usePage } from "hooks/store";
import { useProjectPages } from "hooks/store/use-project-specific-pages";
// layouts
import { AppLayout } from "layouts/app-layout";
import { NextPageWithLayout } from "lib/types";
// components
import { EditorRefApi } from "@plane/document-editor";
import { PageDetailsHeader } from "components/headers/page-details";
import { IssuePeekOverview } from "components/issues";
// ui
import { Spinner, TOAST_TYPE, setToast } from "@plane/ui";
import { PageHead } from "components/core";
// types
import { IPage } from "@plane/types";
// constants
import { PageEditorBody, PageEditorHeaderRoot } from "components/pages";

const PageDetailsPage: NextPageWithLayout = observer(() => {
  // states
  const [sidePeekVisible, setSidePeekVisible] = useState(true);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;
  // store hooks
  const { createPage, projectPageMap, projectArchivedPageMap, fetchProjectPages, fetchArchivedProjectPages } =
    useProjectPages();
  const pageStore = usePage(pageId as string);

  // form info
  const { handleSubmit, getValues, control, reset } = useForm<IPage>({
    defaultValues: {
      name: "",
      description_html: "",
    },
  });
  // fetch all pages from API
  useSWR(
    workspaceSlug && projectId && !projectPageMap[projectId as string] && !projectArchivedPageMap[projectId as string]
      ? `ALL_PAGES_LIST_${projectId}`
      : null,
    workspaceSlug && projectId && !projectPageMap[projectId as string] && !projectArchivedPageMap[projectId as string]
      ? () => fetchProjectPages(workspaceSlug.toString(), projectId.toString())
      : null
  );
  // fetch all archived pages from API
  useSWR(
    workspaceSlug && projectId && !projectArchivedPageMap[projectId as string] && !projectPageMap[projectId as string]
      ? `ALL_ARCHIVED_PAGES_LIST_${projectId}`
      : null,
    workspaceSlug && projectId && !projectArchivedPageMap[projectId as string] && !projectPageMap[projectId as string]
      ? () => fetchArchivedProjectPages(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useEffect(
    () => () => {
      if (pageStore) pageStore.cleanup();
    },
    [pageStore]
  );

  if (!pageStore || !pageStore.id)
    return (
      <div className="h-full w-full grid place-items-center">
        <Spinner />
      </div>
    );

  // we need to get the values of title and description from the page store but we don't have to subscribe to those values
  const pageTitle = pageStore?.name;

  const handleCreatePage = async (payload: Partial<IPage>) => {
    if (!workspaceSlug || !projectId) return;
    await createPage(workspaceSlug.toString(), projectId.toString(), payload);
  };

  const handleUpdatePage = async (formData: IPage) => pageStore.updateDescription(formData.description_html);

  const handleDuplicatePage = async () => {
    const currentPageValues = getValues();

    if (!currentPageValues?.description_html) {
      // TODO: We need to get latest data the above variable will give us stale data
      currentPageValues.description_html = pageStore.description_html;
    }

    const formData: Partial<IPage> = {
      name: "Copy of " + pageStore.name,
      description_html: currentPageValues.description_html,
    };

    try {
      await handleCreatePage(formData);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be duplicated. Please try again later.",
      });
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col justify-between">
        <div className="h-full w-full flex-shrink-0 flex flex-col overflow-hidden">
          {projectId && (
            <PageEditorHeaderRoot
              editorRef={editorRef}
              handleDuplicatePage={handleDuplicatePage}
              pageStore={pageStore}
              projectId={projectId.toString()}
              sidePeekVisible={sidePeekVisible}
              setSidePeekVisible={(state) => setSidePeekVisible(state)}
            />
          )}
          <div className="flex items-center h-full w-full overflow-y-auto">
            <PageEditorBody
              control={control}
              editorRef={editorRef}
              handleSubmit={() => handleSubmit(handleUpdatePage)()}
              pageStore={pageStore}
              sidePeekVisible={sidePeekVisible}
            />
          </div>
          <IssuePeekOverview />
        </div>
      </div>
    </>
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
