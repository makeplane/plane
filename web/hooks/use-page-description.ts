import React, { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { applyUpdates, proseMirrorJSONToBinaryString } from "@plane/document-editor";
import { EditorRefApi, generateJSONfromHTML } from "@plane/editor-core";
import useAutoSave from "@/hooks/use-auto-save";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
import { PageService } from "@/services/page.service";
import { IPageStore } from "@/store/pages/page.store";

const pageService = new PageService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  page: IPageStore;
  projectId: string | string[] | undefined;
  workspaceSlug: string | string[] | undefined;
};

export const usePageDescription = (props: Props) => {
  const { editorRef, page, projectId, workspaceSlug } = props;
  const [isDescriptionReady, setIsDescriptionReady] = useState(false);
  const [localDescriptionYJS, setLocalDescriptionYJS] = useState<Uint8Array>();
  const { isContentEditable, isSubmitting, updateDescription, setIsSubmitting } = page;
  const [hasLocalChanges, setHasLocalChanges] = useState(true);

  const pageDescription = page.description_html;
  const pageId = page.id;

  const { data: pageDescriptionYJS, mutate: mutateDescriptionYJS } = useSWR(
    workspaceSlug && projectId && pageId ? `PAGE_DESCRIPTION_${workspaceSlug}_${projectId}_${pageId}` : null,
    workspaceSlug && projectId && pageId
      ? async () => {
          const encodedDescription = await pageService.fetchDescriptionYJS(
            workspaceSlug.toString(),
            projectId.toString(),
            pageId.toString()
          );
          const decodedDescription = new Uint8Array(encodedDescription);
          return decodedDescription;
        }
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  const handleDescriptionChange = useCallback((update: Uint8Array, source: string) => {
    setHasLocalChanges(true);
    setLocalDescriptionYJS(() => {
      if (source === "initialSync") {
        handleSaveDescription(update);
      }

      return update;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const changeHTMLToBinary = async () => {
      if (!pageDescriptionYJS || !pageDescription) return;
      if (pageDescriptionYJS.byteLength === 0) {
        const { contentJSON, editorSchema } = generateJSONfromHTML(pageDescription ?? "<p></p>");
        const yDocBinaryString = proseMirrorJSONToBinaryString(contentJSON, "default", editorSchema);

        await updateDescription(yDocBinaryString, pageDescription ?? "<p></p>");

        await mutateDescriptionYJS();

        setIsDescriptionReady(true);
      } else setIsDescriptionReady(true);
    };
    changeHTMLToBinary();
  }, [mutateDescriptionYJS, pageDescription, pageDescriptionYJS, updateDescription]);

  const handleSaveDescription = useCallback(
    async (initSyncVectorAsUpdate?: Uint8Array) => {
      const update = localDescriptionYJS ?? initSyncVectorAsUpdate;

      if (update == null) return;

      if (!isContentEditable) return;

      const applyUpdatesAndSave = async (latestDescription: any, update: Uint8Array | undefined) => {
        if (!workspaceSlug || !projectId || !pageId || !latestDescription || !update) return;
        const descriptionArray = new Uint8Array(latestDescription);

        if (!hasLocalChanges) {
          setIsSubmitting("saved");
          return;
        }

        const combinedBinaryString = applyUpdates(descriptionArray, update);
        const descriptionHTML = editorRef.current?.getHTML() ?? "<p></p>";
        await updateDescription(combinedBinaryString, descriptionHTML).finally(() => {
          setIsSubmitting("saved");
          setHasLocalChanges(false);
        });
      };

      try {
        setIsSubmitting("submitting");
        const latestDescription = await mutateDescriptionYJS();
        await applyUpdatesAndSave(latestDescription, update);
      } catch (error) {
        setIsSubmitting("saved");
        throw error;
      }
    },
    [
      localDescriptionYJS,
      editorRef,
      isContentEditable,
      mutateDescriptionYJS,
      hasLocalChanges,
      pageId,
      projectId,
      setIsSubmitting,
      updateDescription,
      workspaceSlug,
    ]
  );

  useAutoSave(handleSaveDescription);

  const { setShowAlert } = useReloadConfirmations(true);

  useEffect(() => {
    if (hasLocalChanges || isSubmitting === "submitting") {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [setShowAlert, hasLocalChanges, isSubmitting]);

  return {
    handleDescriptionChange,
    isDescriptionReady,
    pageDescriptionYJS,
  };
};
