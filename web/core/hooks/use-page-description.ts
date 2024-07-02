import React, { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

import {
  EditorRefApi,
  proseMirrorJSONToBinaryString,
  applyUpdates,
  generateJSONfromHTMLForDocumentEditor,
} from "@plane/editor";

// hooks
import { setToast, TOAST_TYPE } from "@plane/ui";
import useAutoSave from "@/hooks/use-auto-save";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";

// services
import { ProjectPageService } from "@/services/page";
import { IPage } from "@/store/pages/page";

const projectPageService = new ProjectPageService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  page: IPage;
  projectId: string | string[] | undefined;
  workspaceSlug: string | string[] | undefined;
};

export const usePageDescription = (props: Props) => {
  const { editorRef, page, projectId, workspaceSlug } = props;
  const [isDescriptionReady, setIsDescriptionReady] = useState(false);
  const [localDescriptionYJS, setLocalDescriptionYJS] = useState<Uint8Array>();
  const { isContentEditable, isSubmitting, updateDescription, setIsSubmitting } = page;
  const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false);

  const pageDescription = page.description_html;
  const pageId = page.id;

  const { data: pageDescriptionYJS, mutate: mutateDescriptionYJS } = useSWR(
    workspaceSlug && projectId && pageId ? `PAGE_DESCRIPTION_${workspaceSlug}_${projectId}_${pageId}` : null,
    workspaceSlug && projectId && pageId
      ? async () => {
          const encodedDescription = await projectPageService.fetchDescriptionYJS(
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

  // set the merged local doc by the provider to the react local state
  const handleDescriptionChange = useCallback((update: Uint8Array, source?: string) => {
    setLocalDescriptionYJS(() => {
      // handle the initial sync case where indexeddb gives extra update, in
      // this case we need to save the update to the DB
      if (source && source === "initialSync") {
        handleSaveDescription(true, update);
      }

      return update;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // if description_binary field is empty, convert description_html to yDoc and update the DB
  // TODO: this is a one-time operation, and needs to be removed once all the pages are updated
  useEffect(() => {
    const changeHTMLToBinary = async () => {
      if (!pageDescriptionYJS || !pageDescription) return;
      if (pageDescriptionYJS.length === 0) {
        const { contentJSON, editorSchema } = generateJSONfromHTMLForDocumentEditor(pageDescription ?? "<p></p>");
        const yDocBinaryString = proseMirrorJSONToBinaryString(contentJSON, "default", editorSchema);

        try {
          await updateDescription(yDocBinaryString, pageDescription ?? "<p></p>");
        } catch (error) {
          console.log("error", error);
        }

        await mutateDescriptionYJS();

        setIsDescriptionReady(true);
      } else setIsDescriptionReady(true);
    };
    changeHTMLToBinary();
  }, [mutateDescriptionYJS, pageDescription, pageDescriptionYJS, updateDescription]);

  const { setShowAlert } = useReloadConfirmations(true);

  useEffect(() => {
    if (editorRef?.current?.hasUnsyncedChanges() || isSubmitting === "submitting") {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [setShowAlert, isSubmitting, editorRef, localDescriptionYJS]);

  // merge the description from remote to local state and only save if there are local changes
  const handleSaveDescription = useCallback(
    async (forceSync?: boolean, initSyncVectorAsUpdate?: Uint8Array) => {
      const update = localDescriptionYJS ?? initSyncVectorAsUpdate;

      if (update == null) return;

      if (!isContentEditable) return;

      const applyUpdatesAndSave = async (latestDescription: Uint8Array, update: Uint8Array | undefined) => {
        if (!workspaceSlug || !projectId || !pageId || !latestDescription || !update) return;

        if (!forceSync && !editorRef.current?.hasUnsyncedChanges()) {
          setIsSubmitting("saved");
          return;
        }

        const combinedBinaryString = applyUpdates(latestDescription, update);
        const descriptionHTML = editorRef.current?.getHTML() ?? "<p></p>";
        await updateDescription(combinedBinaryString, descriptionHTML)
          .then(() => {
            editorRef.current?.setSynced();
            setHasShownOfflineToast(false);
          })
          .catch((e) => {
            if (e.message === "Network Error" && !hasShownOfflineToast) {
              setToast({
                type: TOAST_TYPE.INFO,
                title: "Info!",
                message: "You seem to be offline, your changes will remain saved on this device",
              });
              setHasShownOfflineToast(true);
            }
            if (e.response?.status === 471) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "Failed to save your changes, the page was locked, your changes will be lost",
              });
            }
            if (e.response?.status === 472) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error!",
                message: "Failed to save your changes, the page was archived, your changes will be lost",
              });
            }
          })
          .finally(() => {
            setShowAlert(false);
            setIsSubmitting("saved");
          });
      };

      try {
        setIsSubmitting("submitting");
        const latestDescription = await mutateDescriptionYJS();
        if (latestDescription) {
          await applyUpdatesAndSave(latestDescription, update);
        }
      } catch (error) {
        setIsSubmitting("saved");
        throw error;
      }
    },
    [
      localDescriptionYJS,
      setShowAlert,
      editorRef,
      hasShownOfflineToast,
      isContentEditable,
      mutateDescriptionYJS,
      pageId,
      projectId,
      setIsSubmitting,
      updateDescription,
      workspaceSlug,
    ]
  );

  useAutoSave(handleSaveDescription);

  return {
    handleDescriptionChange,
    isDescriptionReady,
    pageDescriptionYJS,
    handleSaveDescription,
  };
};
