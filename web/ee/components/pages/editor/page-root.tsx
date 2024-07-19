import { useRef, useState } from "react";
import { observer } from "mobx-react";
// editor
import { EditorRefApi, useEditorMarkings } from "@plane/editor";
// types
import { TPage } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { PageEditorHeaderRoot } from "@/components/pages";
import { useAppRouter } from "@/hooks/use-app-router";
// ee specific
import { WorkspacePageEditorBody } from "@/plane-web/components/pages";
import { useWorkspacePages } from "@/plane-web/hooks/store";
import { useWorkspacePageDescription } from "@/plane-web/hooks/use-workspace-page-description";
import { IWorkspacePageDetails } from "@/plane-web/store/pages/page";

type TPageRootProps = {
  page: IWorkspacePageDetails;
  workspaceSlug: string;
};

export const WorkspacePageRoot = observer((props: TPageRootProps) => {
  // router
  const router = useAppRouter();
  const { workspaceSlug, page } = props;
  const { createPage } = useWorkspacePages();
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
  const { handleDescriptionChange, isDescriptionReady, pageDescriptionYJS, handleSaveDescription } =
    useWorkspacePageDescription({
      editorRef,
      page,
      workspaceSlug,
    });

  const handleCreatePage = async (payload: Partial<TPage>) => await createPage(payload);

  const handleDuplicatePage = async () => {
    const formData: Partial<TPage> = {
      name: "Copy of " + name,
      description_html: editorRef.current?.getHTML() ?? description_html ?? "<p></p>",
      access,
    };

    await handleCreatePage(formData)
      .then((res) => router.push(`/${workspaceSlug}/pages/${res?.id}`))
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
      <WorkspacePageEditorBody
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
