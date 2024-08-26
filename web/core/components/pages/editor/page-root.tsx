import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
// plane editor
import { EditorRefApi, useEditorMarkings } from "@plane/editor";
// plane types
import { TPage } from "@plane/types";
// plane ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { PageEditorHeaderRoot, PageEditorBody, PageVersionsOverlay } from "@/components/pages";
// hooks
import { useProjectPages } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePageDescription } from "@/hooks/use-page-description";
import { useQueryParams } from "@/hooks/use-query-params";
// services
import { ProjectPageVersionService } from "@/services/page";
const projectPageVersionService = new ProjectPageVersionService();
// store
import { IPage } from "@/store/pages/page";

type TPageRootProps = {
  page: IPage;
  projectId: string;
  workspaceSlug: string;
};

export const PageRoot = observer((props: TPageRootProps) => {
  const { projectId, workspaceSlug, page } = props;
  // states
  const [editorReady, setEditorReady] = useState(false);
  const [readOnlyEditorReady, setReadOnlyEditorReady] = useState(false);
  const [sidePeekVisible, setSidePeekVisible] = useState(window.innerWidth >= 768);
  const [isVersionsOverlayOpen, setIsVersionsOverlayOpen] = useState(false);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const readOnlyEditorRef = useRef<EditorRefApi>(null);
  // router
  const router = useAppRouter();
  // search params
  const searchParams = useSearchParams();
  // store hooks
  const { createPage } = useProjectPages();
  // derived values
  const { access, description_html, name } = page;
  // editor markings hook
  const { markings, updateMarkings } = useEditorMarkings();
  // project-description
  const {
    handleDescriptionChange,
    isDescriptionReady,
    pageDescriptionYJS,
    handleSaveDescription,
    manuallyUpdateDescription,
  } = usePageDescription({
    editorRef,
    page,
    projectId,
    workspaceSlug,
  });
  // update query params
  const { updateQueryParams } = useQueryParams();

  const handleCreatePage = async (payload: Partial<TPage>) => await createPage(payload);

  const handleDuplicatePage = async () => {
    const formData: Partial<TPage> = {
      name: "Copy of " + name,
      description_html: editorRef.current?.getHTML() ?? description_html ?? "<p></p>",
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

  return (
    <>
      <PageVersionsOverlay
        activeVersion={version}
        fetchAllVersions={async (pageId) => {
          if (!workspaceSlug || !projectId) return;
          return await projectPageVersionService.fetchAllVersions(
            workspaceSlug.toString(),
            projectId.toString(),
            pageId
          );
        }}
        fetchVersionDetails={async (pageId, versionId) => {
          if (!workspaceSlug || !projectId) return;
          return await projectPageVersionService.fetchVersionById(
            workspaceSlug.toString(),
            projectId.toString(),
            pageId,
            versionId
          );
        }}
        handleRestore={manuallyUpdateDescription}
        isOpen={isVersionsOverlayOpen}
        onClose={handleCloseVersionsOverlay}
        pageId={page.id ?? ""}
      />
      <PageEditorHeaderRoot
        editorRef={editorRef}
        readOnlyEditorRef={readOnlyEditorRef}
        editorReady={editorReady}
        readOnlyEditorReady={readOnlyEditorReady}
        handleDuplicatePage={handleDuplicatePage}
        handleSaveDescription={handleSaveDescription}
        markings={markings}
        page={page}
        sidePeekVisible={sidePeekVisible}
        setSidePeekVisible={(state) => setSidePeekVisible(state)}
      />
      <PageEditorBody
        editorRef={editorRef}
        handleEditorReady={(val) => setEditorReady(val)}
        readOnlyEditorRef={readOnlyEditorRef}
        handleReadOnlyEditorReady={() => setReadOnlyEditorReady(true)}
        markings={markings}
        page={page}
        sidePeekVisible={sidePeekVisible}
        updateMarkings={updateMarkings}
        handleDescriptionChange={handleDescriptionChange}
        isDescriptionReady={isDescriptionReady}
        pageDescriptionYJS={pageDescriptionYJS}
      />
    </>
  );
});
