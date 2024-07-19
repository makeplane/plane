import { useRef, useState } from "react";
import { observer } from "mobx-react";
// editor
import { EditorRefApi, useEditorMarkings } from "@plane/editor";
// types
import { TPage } from "@plane/types";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { PageEditorHeaderRoot, PageEditorBody } from "@/components/pages";
// hooks
import { useProjectPages } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
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
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  const readOnlyEditorRef = useRef<EditorRefApi>(null);
  // router
  const router = useAppRouter();
  // store hooks
  const { createPage } = useProjectPages();
  // derived values
  const { access, description_html, name } = page;
  // editor markings hook
  const { markings, updateMarkings } = useEditorMarkings();

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
      />
    </>
  );
});
