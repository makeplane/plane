import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { EditorRefApi, useEditorMarkings } from "@plane/editor";
import { TPage } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { PageEditorHeaderRoot, PageEditorBody } from "@/components/pages";
import { useProjectPages } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePageDescription } from "@/hooks/use-page-description";
import { IPage } from "@/store/pages/page";

type TPageRootProps = {
  page: IPage;
  projectId: string;
  workspaceSlug: string;
};

export const PageRoot = observer((props: TPageRootProps) => {
  // router
  const router = useAppRouter();
  const { projectId, workspaceSlug, page } = props;
  const { createPage } = useProjectPages();
  const { access, description_html, name } = page;

  // states
  const [editorReady, setEditorReady] = useState(false);
  const [readOnlyEditorReady, setReadOnlyEditorReady] = useState(false);

  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const readOnlyEditorRef = useRef<EditorRefApi>(null);

  // editor markings hook
  const { markings, updateMarkings } = useEditorMarkings();

  const [sidePeekVisible, setSidePeekVisible] = useState(window.innerWidth >= 768 ? true : false);

  // project-description
  const { handleDescriptionChange, isDescriptionReady, pageDescriptionYJS, handleSaveDescription } = usePageDescription(
    {
      editorRef,
      page,
      projectId,
      workspaceSlug,
    }
  );

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

  return (
    <>
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
