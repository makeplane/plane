import { useEffect } from "react";
import { EIssueServiceType } from "@plane/types";
import { TNotificationPreview } from "@/ce/hooks/use-notification-preview";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { useAppTheme } from "@/hooks/store/use-app-theme"
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { EpicPeekOverview } from "@/plane-web/components/epics/peek-overview";

/**
 * This function returns if the current active notification is related to work item or an epic.
 * @returns isWorkItem: boolean, peekOverviewComponent: IWorkItemPeekOverview, setPeekWorkItem
 */
export const useNotificationPreview = (): TNotificationPreview => {
  const { peekIssue, setPeekIssue } = useIssueDetail(EIssueServiceType.ISSUES);
  const { peekIssue: peekEpic, setPeekIssue: setPeekEpic } = useIssueDetail(EIssueServiceType.EPICS);
  const { toggleEpicDetailSidebar } = useAppTheme();

  const isWorkItem = Boolean(peekIssue && !peekEpic);

  // set epic detail sidebar to collapsed
  useEffect(() => {
    if (peekEpic) {
      toggleEpicDetailSidebar(true);
    }
  }, [peekEpic, toggleEpicDetailSidebar]);

  return {
    isWorkItem,
    PeekOverviewComponent: isWorkItem ? IssuePeekOverview : EpicPeekOverview,
    setPeekWorkItem: isWorkItem ? setPeekIssue : setPeekEpic,
  };
};
