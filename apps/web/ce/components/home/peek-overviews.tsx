import { observer } from "mobx-react";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

export const HomePeekOverviewsRoot = observer(function HomePeekOverviewsRoot() {
  const { peekIssue } = useIssueDetail();

  return peekIssue ? <IssuePeekOverview /> : null;
});
