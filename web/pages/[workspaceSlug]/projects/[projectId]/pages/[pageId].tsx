import { ReactElement, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import useSWR from "swr";
// document-editor
import { EditorRefApi, useEditorMarkings } from "@plane/document-editor";
// types
import { TPage } from "@plane/types";
// ui
import { TOAST_TYPE, getButtonStyling, setToast } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { PageDetailsHeader } from "@/components/headers";
import { IssuePeekOverview } from "@/components/issues";
import { PageEditorBody, PageEditorHeaderRoot } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { usePage, useProjectPages } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
// lib
import { NextPageWithLayout } from "@/lib/types";

const PageDetailsPage: NextPageWithLayout = observer(() => {
  // states
  const [sidePeekVisible, setSidePeekVisible] = useState(window.innerWidth >= 768 ? true : false);
  const [editorReady, setEditorReady] = useState(false);
  const [readOnlyEditorReady, setReadOnlyEditorReady] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const readOnlyEditorRef = useRef<EditorRefApi>(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;
  // store hooks
  const { createPage, getPageById } = useProjectPages(projectId?.toString() ?? "");
  const pageStore = usePage(pageId?.toString() ?? "");
  // editor markings hook
  const { markings, updateMarkings } = useEditorMarkings();
  // form info
  const { handleSubmit, getValues, control } = useForm<TPage>({
    defaultValues: {
      name: "",
      description_html: "",
    },
  });

  // fetching page details
  const {
    data: swrPageDetails,
    isValidating,
    error: pageDetailsError,
  } = useSWR(pageId ? `PAGE_DETAILS_${pageId}` : null, pageId ? () => getPageById(pageId.toString()) : null, {
    revalidateIfStale: false,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  useEffect(
    () => () => {
      if (pageStore.cleanup) pageStore.cleanup();
    },
    [pageStore]
  );

  if ((!pageStore || !pageStore.id) && !pageDetailsError)
    return (
      <div className="h-full w-full grid place-items-center">
        <LogoSpinner />
      </div>
    );

  if (pageDetailsError)
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-center">Page not found</h3>
        <p className="text-sm text-custom-text-200 text-center mt-3">
          The page you are trying to access doesn{"'"}t exist or you don{"'"}t have permission to view it.
        </p>
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/pages`}
          className={cn(getButtonStyling("neutral-primary", "md"), "mt-5")}
        >
          View other Pages
        </Link>
      </div>
    );

  // we need to get the values of title and description from the page store but we don't have to subscribe to those values
  const pageTitle = pageStore?.name;

  const handleCreatePage = async (payload: Partial<TPage>) => await createPage(payload);

  const handleUpdatePage = async (formData: TPage) => {
    let updatedDescription = formData.description_html;
    if (!updatedDescription || updatedDescription.trim() === "") updatedDescription = "<p></p>";
    pageStore.updateDescription(updatedDescription);
  };

  const handleDuplicatePage = async () => {
    const currentPageValues = getValues();

    if (!currentPageValues?.description_html) {
      // TODO: We need to get latest data the above variable will give us stale data
      currentPageValues.description_html = pageStore.description_html;
    }

    const formData: Partial<TPage> = {
      name: "Copy of " + pageStore.name,
      description_html: currentPageValues.description_html,
    };

    await handleCreatePage(formData)
      .then((res) => router.push(`/${workspaceSlug}/projects/${projectId}/pages/${res?.id}`))
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be duplicated. Please try again later.",
        })
      );
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full flex-col justify-between">
        <div className="h-full w-full flex-shrink-0 flex flex-col overflow-hidden">
          {projectId && (
            <PageEditorHeaderRoot
              editorRef={editorRef}
              readOnlyEditorRef={readOnlyEditorRef}
              editorReady={editorReady}
              readOnlyEditorReady={readOnlyEditorReady}
              handleDuplicatePage={handleDuplicatePage}
              isSyncing={isValidating}
              markings={markings}
              pageStore={pageStore}
              projectId={projectId.toString()}
              sidePeekVisible={sidePeekVisible}
              setSidePeekVisible={(state) => setSidePeekVisible(state)}
            />
          )}
          <PageEditorBody
            swrPageDetails={swrPageDetails}
            control={control}
            editorRef={editorRef}
            handleEditorReady={(val) => setEditorReady(val)}
            readOnlyEditorRef={readOnlyEditorRef}
            handleReadOnlyEditorReady={() => setReadOnlyEditorReady(true)}
            handleSubmit={() => handleSubmit(handleUpdatePage)()}
            markings={markings}
            pageStore={pageStore}
            sidePeekVisible={sidePeekVisible}
            updateMarkings={updateMarkings}
          />
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
