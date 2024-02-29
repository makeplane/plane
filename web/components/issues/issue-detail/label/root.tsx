import { FC, useMemo } from "react";
import { observer } from "mobx-react-lite";
// components
import { LabelList, LabelCreate, IssueLabelSelectRoot } from "./";
// hooks
import { useIssueDetail, useLabel } from "hooks/store";
// types
import { IIssueLabel, TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "components/toast";

export type TIssueLabel = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export type TLabelOperations = {
  updateIssue: (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>;
  createLabel: (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) => Promise<any>;
};

export const IssueLabel: FC<TIssueLabel> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled = false } = props;
  // hooks
  const { updateIssue } = useIssueDetail();
  const { createLabel } = useLabel();
  // const { setToastAlert } = useToast();

  const labelOperations: TLabelOperations = useMemo(
    () => ({
      updateIssue: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await updateIssue(workspaceSlug, projectId, issueId, data);
          setToast({
            title: "Issue updated successfully",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue updated successfully",
          });
        } catch (error) {
          setToast({
            title: "Issue update failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue update failed",
          });
        }
      },
      createLabel: async (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) => {
        try {
          const labelResponse = await createLabel(workspaceSlug, projectId, data);
          setToast({
            title: "Label created successfully",
            type: TOAST_TYPE.SUCCESS,
            message: "Label created successfully",
          });
          return labelResponse;
        } catch (error) {
          setToast({
            title: "Label creation failed",
            type: TOAST_TYPE.ERROR,
            message: "Label creation failed",
          });
          return error;
        }
      },
    }),
    [updateIssue, createLabel]
  );

  return (
    <div className="relative flex flex-wrap items-center gap-1">
      <LabelList
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        labelOperations={labelOperations}
        disabled={disabled}
      />

      {!disabled && (
        <IssueLabelSelectRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          labelOperations={labelOperations}
        />
      )}

      {!disabled && (
        <LabelCreate
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          labelOperations={labelOperations}
        />
      )}
    </div>
  );
});
