/* eslint-disable @typescript-eslint/no-unused-vars */
import type { TIssueGroupByOptions } from "@plane/types";

export const useWorkFlowFDragNDrop = (
  groupBy: TIssueGroupByOptions | undefined,
  subGroupBy?: TIssueGroupByOptions
) => ({
  workflowDisabledSource: undefined,
  isWorkflowDropDisabled: false,
  getIsWorkflowWorkItemCreationDisabled: (groupId: string, subGroupId?: string) => false,
  handleWorkFlowState: (
    sourceGroupId: string,
    destinationGroupId: string,
    sourceSubGroupId?: string,
    destinationSubGroupId?: string
  ) => {},
});
