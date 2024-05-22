import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
// editor
import { applyUpdates, mergeUpdates, proseMirrorJSONToBinaryString } from "@plane/document-editor";
import { EditorRefApi, generateJSONfromHTML } from "@plane/editor-core";
// hooks
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// services
import { PageService } from "@/services/page.service";
import { IPageStore } from "@/store/pages/page.store";
const pageService = new PageService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  page: IPageStore;
  projectId: string | string[] | undefined;
  workspaceSlug: string | string[] | undefined;
};

const AUTO_SAVE_TIME = 10000;

export const usePageDescription = (props: Props) => {
  const { editorRef, page, projectId, workspaceSlug } = props;
  // states
  const [isDescriptionReady, setIsDescriptionReady] = useState(false);
  const [descriptionUpdates, setDescriptionUpdates] = useState<Uint8Array[]>([]);
  // derived values
  const { isContentEditable, isSubmitting, updateDescription, setIsSubmitting } = page;
  const pageDescription = page.description_html;
  const pageId = page.id;

  const { data: descriptionYJS, mutate: mutateDescriptionYJS } = useSWR(
    workspaceSlug && projectId && pageId ? `PAGE_DESCRIPTION_${workspaceSlug}_${projectId}_${pageId}` : null,
    workspaceSlug && projectId && pageId
      ? () => pageService.fetchDescriptionYJS(workspaceSlug.toString(), projectId.toString(), pageId.toString())
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );
  // description in Uint8Array format
  const pageDescriptionYJS = useMemo(
    () => (descriptionYJS ? new Uint8Array(descriptionYJS) : undefined),
    [descriptionYJS]
  );

  // push the new updates to the updates array
  const handleDescriptionChange = useCallback((updates: Uint8Array) => {
    setDescriptionUpdates((prev) => [...prev, updates]);
  }, []);

  // if description_binary field is empty, convert description_html to yDoc and update the DB
  // TODO: this is a one-time operation, and needs to be removed once all the pages are updated
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

  const handleSaveDescription = useCallback(async () => {
    if (!isContentEditable) return;

    const applyUpdatesAndSave = async (latestDescription: any, updates: Uint8Array) => {
      if (!workspaceSlug || !projectId || !pageId || !latestDescription) return;
      // convert description to Uint8Array
      const descriptionArray = new Uint8Array(latestDescription);
      // apply the updates to the description
      const combinedBinaryString = applyUpdates(descriptionArray, updates);
      // get the latest html content
      const descriptionHTML = editorRef.current?.getHTML() ?? "<p></p>";
      // make a request to update the descriptions
      await updateDescription(combinedBinaryString, descriptionHTML).finally(() => setIsSubmitting("saved"));
    };

    try {
      setIsSubmitting("submitting");
      // fetch the latest description
      const latestDescription = await mutateDescriptionYJS();
      // return if there are no updates
      if (descriptionUpdates.length <= 0) {
        setIsSubmitting("saved");
        return;
      }
      // merge the updates array into one single update
      const mergedUpdates = mergeUpdates(descriptionUpdates);
      await applyUpdatesAndSave(latestDescription, mergedUpdates);
      // reset the updates array to empty
      setDescriptionUpdates([]);
    } catch (error) {
      setIsSubmitting("saved");
      throw error;
    }
  }, [
    descriptionUpdates,
    editorRef,
    isContentEditable,
    mutateDescriptionYJS,
    pageId,
    projectId,
    setIsSubmitting,
    updateDescription,
    workspaceSlug,
  ]);

  // auto-save updates every 10 seconds
  // handle ctrl/cmd + S to save the description
  useEffect(() => {
    const intervalId = setInterval(handleSaveDescription, AUTO_SAVE_TIME);

    const handleSave = (e: KeyboardEvent) => {
      const { ctrlKey, metaKey, key } = e;
      const cmdClicked = ctrlKey || metaKey;

      if (cmdClicked && key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopPropagation();
        handleSaveDescription();

        // reset interval timer
        clearInterval(intervalId);
      }
    };
    window.addEventListener("keydown", handleSave);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("keydown", handleSave);
    };
  }, [handleSaveDescription]);

  // show a confirm dialog if there are any unsaved changes, or saving is going on
  const { setShowAlert } = useReloadConfirmations(descriptionUpdates.length > 0 || isSubmitting === "submitting");
  useEffect(() => {
    if (descriptionUpdates.length > 0 || isSubmitting === "submitting") setShowAlert(true);
    else setShowAlert(false);
  }, [descriptionUpdates, isSubmitting, setShowAlert]);

  return {
    handleDescriptionChange,
    isDescriptionReady,
    pageDescriptionYJS,
  };
};
