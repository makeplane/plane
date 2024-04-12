import { FC, useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { EditorRefApi } from "@plane/rich-text-editor";
import { TIssue } from "@plane/types";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  InboxIssueTitle,
  InboxIssueDescription,
  InboxIssueProperties,
} from "@/components/inbox/modals/create-edit-modal";
// constants
import { ISSUE_UPDATED } from "@/constants/event-tracker";
// helpers
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// hooks
import { useEventTracker, useProjectInbox, useWorkspace } from "@/hooks/store";

type TInboxIssueEditRoot = {
  workspaceSlug: string;
  projectId: string;
  issue: Partial<TIssue>;
  handleModalClose: () => void;
  onSubmit?: () => void;
};

export const InboxIssueEditRoot: FC<TInboxIssueEditRoot> = observer((props) => {
  const { workspaceSlug, projectId, issue, handleModalClose, onSubmit } = props;
  const router = useRouter();
  // refs
  const descriptionEditorRef = useRef<EditorRefApi>(null);
  // hooks
  const { captureIssueEvent } = useEventTracker();
  const { createInboxIssue } = useProjectInbox();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  // states
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TIssue> | undefined>();
  const handleFormData = useCallback(
    <T extends keyof Partial<TIssue>>(issueKey: T, issueValue: Partial<TIssue>[T]) => {
      setFormData({
        ...formData,
        [issueKey]: issueValue,
      });
    },
    [formData]
  );

  useEffect(() => {
    if (formData?.id != issue?.id)
      setFormData({
        id: issue?.id || undefined,
        name: issue?.name ?? "",
        description_html: issue?.description_html ?? "<p></p>",
        priority: issue?.priority ?? "none",
        state_id: issue?.state_id ?? "",
        label_ids: issue?.label_ids ?? [],
        assignee_ids: issue?.assignee_ids ?? [],
        start_date: renderFormattedPayloadDate(issue?.start_date) ?? "",
        target_date: renderFormattedPayloadDate(issue?.target_date) ?? "",
      });
  }, [issue, formData]);

  const handleFormSubmit = async () => {
    const payload: Partial<TIssue> = {
      name: formData?.name || "",
      description_html: formData?.description_html || "<p></p>",
      priority: formData?.priority || "none",
      state_id: formData?.state_id || "",
      label_ids: formData?.label_ids || [],
      assignee_ids: formData?.assignee_ids || [],
      target_date: formData?.target_date || "",
    };
    setFormSubmitting(true);

    await createInboxIssue(workspaceSlug, projectId, payload)
      .then(async () => {
        onSubmit && (await onSubmit());
        captureIssueEvent({
          eventName: ISSUE_UPDATED,
          payload: {
            ...formData,
            state: "SUCCESS",
            element: "Inbox page",
          },
          path: router.pathname,
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: `${TOAST_TYPE.SUCCESS}!`,
          message: "Issue created successfully.",
        });
        descriptionEditorRef?.current?.clearEditor();
        handleModalClose();
      })
      .catch((error) => {
        console.error(error);
        captureIssueEvent({
          eventName: ISSUE_UPDATED,
          payload: {
            ...formData,
            state: "FAILED",
            element: "Inbox page",
          },
          path: router.pathname,
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: `${TOAST_TYPE.ERROR}!`,
          message: "Some error occurred. Please try again.",
        });
      });
    setFormSubmitting(false);
  };

  if (!workspaceSlug || !projectId || !workspaceId || !formData) return <></>;
  return (
    <div className="relative space-y-4">
      <InboxIssueTitle data={formData} handleData={handleFormData} />
      <InboxIssueDescription
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        workspaceId={workspaceId}
        data={formData}
        handleData={handleFormData}
        editorRef={descriptionEditorRef}
      />
      <InboxIssueProperties projectId={projectId} data={formData} handleData={handleFormData} />
      <div className="relative flex justify-end items-center gap-3">
        <Button variant="neutral-primary" size="sm" type="button" onClick={handleModalClose}>
          Discard
        </Button>
        <Button variant="primary" size="sm" type="button" loading={formSubmitting} onClick={handleFormSubmit}>
          {formSubmitting ? "Updating Issue..." : "Update Issue"}
        </Button>
      </div>
    </div>
  );
});
