import React, { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
// editor
import { applyUpdates, proseMirrorJSONToBinaryString } from "@plane/document-editor";
import { EditorRefApi, generateJSONfromHTML } from "@plane/editor-core";
// hooks
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// services
import useAutoSave from "./use-auto-save";

type TIssueDescription = {
  description_binary: string;
  description_html: string;
};
type Props = {
  canUpdateDescription: boolean;
  editorRef: React.RefObject<EditorRefApi>;
  isSubmitting: "submitting" | "submitted" | "saved";
  issueId: string | string[] | undefined;
  projectId: string | string[] | undefined;
  setIsSubmitting: (initialValue: "submitting" | "submitted" | "saved") => void;
  issueDescriptionHTML: string;
  updateIssueDescription: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TIssueDescription
  ) => Promise<void>;
  fetchIssueDescription: (workspaceSlug: string, projectId: string, issueId: string) => Promise<string | undefined>;
  workspaceSlug: string | string[] | undefined;
};

export const useIssueDescription = (props: Props) => {
  const {
    indexedDBPrefix,
    canUpdateDescription,
    editorRef,
    isSubmitting,
    issueId,
    projectId,
    setIsSubmitting,
    issueDescriptionHTML,
    updateIssueDescription,
    fetchIssueDescription,
    workspaceSlug,
  } = props;
  // states
  const [isDescriptionReady, setIsDescriptionReady] = useState(false);
  const [localDescriptionYJS, setLocalDescriptionYJS] = useState<Uint8Array>();

  const { data: issueDescriptionYJS, mutate: mutateDescriptionYJS } = useSWR(
    workspaceSlug && projectId && issueId ? `ISSUE_DESCRIPTION_BINARY_${workspaceSlug}_${projectId}_${issueId}` : null,
    workspaceSlug && projectId && issueId
      ? async () => {
          const encodedDescription = await fetchIssueDescription(
            workspaceSlug.toString(),
            projectId.toString(),
            issueId.toString()
          );
          // @ts-expect-error - TODO: fix this
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

  // push the new updates to the updates array
  const handleDescriptionChange = useCallback((update: Uint8Array, source?: string) => {
    setLocalDescriptionYJS(() => {
      // handle the initial sync case where indexeddb gives extra update, in
      // this case we need to save the update to the DB
      if (source && source === "initialSync") {
        handleSaveDescription(update);
      }

      return update;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // if description_binary field is empty, convert description_html to yDoc and update the DB
  // TODO: this is a one-time operation, and needs to be removed once all the issues are updated
  useEffect(() => {
    const changeHTMLToBinary = async () => {
      if (!workspaceSlug || !projectId || !issueId) return;
      if (!issueDescriptionYJS || !issueDescriptionHTML) return;

      if (issueDescriptionYJS.length === 0 && !isDescriptionReady) {
        const { contentJSON, editorSchema } = generateJSONfromHTML(issueDescriptionHTML ?? "<p></p>");
        const yDocBinaryString = proseMirrorJSONToBinaryString(contentJSON, "default", editorSchema);

        // TODO - make sure mobx is also taken care of
        await updateIssueDescription(workspaceSlug.toString(), projectId.toString(), issueId.toString(), {
          description_binary: yDocBinaryString,
          description_html: issueDescriptionHTML ?? "<p></p>",
        });

        await mutateDescriptionYJS();

        setIsDescriptionReady(true);
      } else setIsDescriptionReady(true);
    };
    changeHTMLToBinary();
  }, [
    isDescriptionReady,
    mutateDescriptionYJS,
    issueDescriptionHTML,
    updateIssueDescription,
    issueDescriptionYJS,
    issueId,
    projectId,
    workspaceSlug,
  ]);

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
    async (initSyncVectorAsUpdate?: Uint8Array) => {
      const update = localDescriptionYJS ?? initSyncVectorAsUpdate;

      if (update == null) return;

      if (!canUpdateDescription) return;

      const applyUpdatesAndSave = async (latestDescription: any, update: Uint8Array) => {
        if (!workspaceSlug || !projectId || !issueId || !latestDescription || !update) return;

        const combinedBinaryString = applyUpdates(latestDescription, update);
        const descriptionHTML = editorRef.current?.getHTML() ?? "<p></p>";
        await updateIssueDescription(workspaceSlug.toString(), projectId.toString(), issueId.toString(), {
          description_binary: combinedBinaryString,
          description_html: descriptionHTML ?? "<p></p>",
        }).finally(() => {
          editorRef.current?.setSynced();
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
      canUpdateDescription,
      updateIssueDescription,
      editorRef,
      issueId,
      mutateDescriptionYJS,
      projectId,
      setIsSubmitting,
      workspaceSlug,
    ]
  );

  useAutoSave(handleSaveDescription);

  return {
    handleDescriptionChange,
    isDescriptionReady,
    issueDescriptionYJS,
  };
};
