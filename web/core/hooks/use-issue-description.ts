import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
// editor
import { applyUpdates, mergeUpdates, proseMirrorJSONToBinaryString } from "@plane/document-editor";
import { EditorRefApi, generateJSONfromHTML } from "@plane/editor-core";
// hooks
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// services
import { IssueService } from "@/services/issue";
import { useIssueDetail } from "./store";
import useAutoSave from "./use-auto-save";
const issueService = new IssueService();

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
  updateIssueDescription: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    data: TIssueDescription
  ) => Promise<void>;
  workspaceSlug: string | string[] | undefined;
};

const AUTO_SAVE_TIME = 10000;

export const useIssueDescription = (props: Props) => {
  const {
    canUpdateDescription,
    editorRef,
    isSubmitting,
    issueId,
    projectId,
    setIsSubmitting,
    updateIssueDescription,
    workspaceSlug,
  } = props;
  // states
  const [isDescriptionReady, setIsDescriptionReady] = useState(false);
  const [descriptionUpdates, setDescriptionUpdates] = useState<Uint8Array[]>([]);
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issueDetails = issueId ? getIssueById(issueId.toString()) : undefined;
  const issueDescription = issueDetails?.description_html;

  const { data: descriptionBinary, mutate: mutateDescriptionBinary } = useSWR(
    workspaceSlug && projectId && issueId ? `ISSUE_DESCRIPTION_BINARY_${workspaceSlug}_${projectId}_${issueId}` : null,
    workspaceSlug && projectId && issueId
      ? () => issueService.fetchDescriptionBinary(workspaceSlug.toString(), projectId.toString(), issueId.toString())
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );
  // description in Uint8Array format
  const issueDescriptionYJS = useMemo(
    () => (descriptionBinary ? new Uint8Array(descriptionBinary) : undefined),
    [descriptionBinary]
  );

  // push the new updates to the updates array
  const handleDescriptionChange = useCallback((updates: Uint8Array) => {
    setDescriptionUpdates((prev) => [...prev, updates]);
  }, []);

  // if description_binary field is empty, convert description_html to yDoc and update the DB
  // TODO: this is a one-time operation, and needs to be removed once all the issues are updated
  useEffect(() => {
    const changeHTMLToBinary = async () => {
      if (!workspaceSlug || !projectId || !issueId) return;
      if (!issueDescriptionYJS || !issueDescription) return;
      if (issueDescriptionYJS.byteLength === 0) {
        const { contentJSON, editorSchema } = generateJSONfromHTML(issueDescription ?? "<p></p>");
        const yDocBinaryString = proseMirrorJSONToBinaryString(contentJSON, "default", editorSchema);
        await updateIssueDescription(workspaceSlug.toString(), projectId.toString(), issueId.toString(), {
          description_binary: yDocBinaryString,
          description_html: issueDescription ?? "<p></p>",
        });
        await mutateDescriptionBinary();
        setIsDescriptionReady(true);
      } else setIsDescriptionReady(true);
    };
    changeHTMLToBinary();
  }, [
    issueDescription,
    issueId,
    mutateDescriptionBinary,
    issueDescriptionYJS,
    projectId,
    updateIssueDescription,
    workspaceSlug,
  ]);

  const handleSaveDescription = useCallback(async () => {
    if (!canUpdateDescription) return;

    const applyUpdatesAndSave = async (latestDescription: any, updates: Uint8Array) => {
      if (!workspaceSlug || !projectId || !issueId || !latestDescription) return;
      // convert description to Uint8Array
      const descriptionArray = new Uint8Array(latestDescription);
      // apply the updates to the description
      const combinedBinaryString = applyUpdates(descriptionArray, updates);
      // get the latest html content
      const descriptionHTML = editorRef.current?.getHTML() ?? "<p></p>";
      // make a request to update the descriptions
      await updateIssueDescription(workspaceSlug.toString(), projectId.toString(), issueId.toString(), {
        description_binary: combinedBinaryString,
        description_html: descriptionHTML,
      }).finally(() => setIsSubmitting("saved"));
    };

    try {
      setIsSubmitting("submitting");
      // fetch the latest description
      const latestDescription = await mutateDescriptionBinary();
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
    canUpdateDescription,
    descriptionUpdates,
    editorRef,
    issueId,
    mutateDescriptionBinary,
    projectId,
    setIsSubmitting,
    updateIssueDescription,
    workspaceSlug,
  ]);

  useAutoSave(handleSaveDescription);

  // show a confirm dialog if there are any unsaved changes, or saving is going on
  const { setShowAlert } = useReloadConfirmations(descriptionUpdates.length > 0 || isSubmitting === "submitting");

  useEffect(() => {
    if (descriptionUpdates.length > 0 || isSubmitting === "submitting") setShowAlert(true);
    else setShowAlert(false);
  }, [descriptionUpdates, isSubmitting, setShowAlert]);

  return {
    handleDescriptionChange,
    isDescriptionReady,
    issueDescriptionYJS,
  };
};
