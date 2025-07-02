import { EIssueServiceType, IWorkItemPeekOverview } from "@plane/types";
import { IssuePeekOverview } from "@/components/issues";
import { useIssueDetail } from "@/hooks/store";
import { TPeekIssue } from "@/store/issue/issue-details/root.store";

export type TNotificationPreview = {
  isWorkItem: boolean;
  PeekOverviewComponent: React.ComponentType<IWorkItemPeekOverview>;
  setPeekWorkItem: (peekIssue: TPeekIssue | undefined) => void;
};

/**
 * This function returns if the current active notification is related to work item or an epic.
 * @returns isWorkItem: boolean, peekOverviewComponent: IWorkItemPeekOverview, setPeekWorkItem
 */
export const useNotificationPreview = (): TNotificationPreview => {
  const { peekIssue, setPeekIssue } = useIssueDetail(EIssueServiceType.ISSUES);

  return {
    isWorkItem: Boolean(peekIssue),
    PeekOverviewComponent: IssuePeekOverview,
    setPeekWorkItem: setPeekIssue,
  };
};
