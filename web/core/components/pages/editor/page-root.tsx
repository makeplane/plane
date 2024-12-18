import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// editor
import { EditorRefApi } from "@plane/editor";
// types
import { TDocumentPayload, TPage, TPageVersion } from "@plane/types";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { PageEditorHeaderRoot, PageEditorBody, PageVersionsOverlay, PagesVersionEditor } from "@/components/pages";
// hooks
import { useProjectPages } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePageFallback } from "@/hooks/use-page-fallback";
import { useQueryParams } from "@/hooks/use-query-params";
// store
import { IPage } from "@/store/pages/page";

type TPageRootProps = {
  descriptionHandler: {
    fetch: () => Promise<any>;
    update: (data: TDocumentPayload) => Promise<void>;
  };
  page: IPage;
  projectId: string;
  versionHistoryHandler: {
    fetchAll: (pageId: string) => Promise<TPageVersion[] | undefined>;
    fetchDetails: (pageId: string, versionId: string) => Promise<TPageVersion | undefined>;
  };
  workspaceSlug: string;
};

export const PageRoot = observer((props: TPageRootProps) => {
  const { descriptionHandler, page, projectId, versionHistoryHandler, workspaceSlug } = props;
  // states
  const [editorReady, setEditorReady] = useState(false);
  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);
  const [sidePeekVisible, setSidePeekVisible] = useState(window.innerWidth >= 768);
  const [isVersionsOverlayOpen, setIsVersionsOverlayOpen] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // router
  const router = useAppRouter();
  // search params
  const searchParams = useSearchParams();
  // store hooks
  const { createPage } = useProjectPages();
  // derived values
  const { access, description_html, name, isContentEditable } = page;
  // page fallback
  usePageFallback({
    editorRef,
    fetchPageDescription: async () => await descriptionHandler.fetch(),
    hasConnectionFailed,
    updatePageDescription: async (data) => await descriptionHandler.update(data),
  });
  // update query params
  const { updateQueryParams } = useQueryParams();

  const handleCreatePage = async (payload: Partial<TPage>) => await createPage(payload);

  const handleDuplicatePage = async () => {
    const formData: Partial<TPage> = {
      name: "Copy of " + name,
      description_html: editorRef.current?.getDocument().html ?? description_html ?? "<p></p>",
      access,
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

  const version = searchParams.get("version");
  useEffect(() => {
    if (!version) {
      setIsVersionsOverlayOpen(false);
      return;
    }
    setIsVersionsOverlayOpen(true);
  }, [version]);

  const handleCloseVersionsOverlay = () => {
    const updatedRoute = updateQueryParams({
      paramsToRemove: ["version"],
    });
    router.push(updatedRoute);
  };

  const handleRestoreVersion = async (descriptionHTML: string) => {
    editorRef.current?.clearEditor();
    editorRef.current?.setEditorValue(descriptionHTML);
  };
  const currentVersionDescription = editorRef.current?.getDocument().html;

  return (
    <>
      <PageVersionsOverlay
        activeVersion={version}
        currentVersionDescription={currentVersionDescription ?? null}
        editorComponent={PagesVersionEditor}
        fetchAllVersions={async (pageId) => await versionHistoryHandler.fetchAll(pageId)}
        fetchVersionDetails={async (pageId, versionId) => await versionHistoryHandler.fetchDetails(pageId, versionId)}
        handleRestore={handleRestoreVersion}
        isOpen={isVersionsOverlayOpen}
        onClose={handleCloseVersionsOverlay}
        pageId={page.id ?? ""}
        restoreEnabled={isContentEditable}
      />
      <PageEditorHeaderRoot
        editorReady={editorReady}
        editorRef={editorRef}
        handleDuplicatePage={handleDuplicatePage}
        page={page}
        setSidePeekVisible={(state) => setSidePeekVisible(state)}
        sidePeekVisible={sidePeekVisible}
      />
      <PageEditorBody
        editorReady={editorReady}
        editorRef={editorRef}
        handleConnectionStatus={setHasConnectionFailed}
        handleEditorReady={setEditorReady}
        page={page}
        sidePeekVisible={sidePeekVisible}
      />
    </>
  );
});
