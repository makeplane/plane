import { ReactElement, useEffect } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { WorkspaceDashboardView } from "components/page-views";
import { WorkspaceDashboardHeader } from "components/headers/workspace-dashboard";
// types
import { NextPageWithLayout } from "types/app";
// TODO: remove this changes
import { observer } from "mobx-react-lite";
import { useIssueDetail } from "hooks/store";

const WorkspacePage: NextPageWithLayout = observer(() => {
  // const issueDetail = useIssueDetail();
  const issueId = "e45a59ae-72e3-49bb-b6eb-1679959b2e18";

  // useEffect(() => {
  //   const init = async () => await issueDetail.fetchIssue("plane", "02c3e1d5-d7e2-401d-a773-45ecba45d745", issueId);
  //   init();
  // }, [issueDetail]);

  // console.log(issueDetail?.issue);

  return <WorkspaceDashboardView />;
});

WorkspacePage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<WorkspaceDashboardHeader />}>{page}</AppLayout>;
};

export default WorkspacePage;
