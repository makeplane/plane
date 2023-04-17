import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// services
import userService from "services/user.service";
// components
import {
  CompletedIssuesGraph,
  IssuesList,
  IssuesPieChart,
  IssuesStats,
} from "components/workspace";
// types
import type { NextPage } from "next";
// fetch-keys
import { USER_WORKSPACE_DASHBOARD } from "constants/fetch-keys";

const WorkspacePage: NextPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: workspaceDashboardData } = useSWR(
    workspaceSlug ? USER_WORKSPACE_DASHBOARD(workspaceSlug as string) : null,
    workspaceSlug ? () => userService.userWorkspaceDashboard(workspaceSlug as string, month) : null
  );

  useEffect(() => {
    if (!workspaceSlug) return;

    mutate(USER_WORKSPACE_DASHBOARD(workspaceSlug as string));
  }, [month, workspaceSlug]);

  return (
    <WorkspaceAuthorizationLayout noHeader>
      <div className="h-full w-full">
        <div className="flex flex-col gap-8">
          <div
            className="flex flex-col bg-white justify-between gap-x-2 gap-y-6 rounded-lg px-8 py-6 text-black md:flex-row md:items-center md:py-3"
            // style={{ background: "linear-gradient(90deg, #8e2de2 0%, #4a00e0 100%)" }}
          >
            <p className="font-semibold">
              Plane is open source, support us by staring us on GitHub.
            </p>
            <div className="flex items-center gap-2">
              {/* <a href="#" target="_blank" rel="noopener noreferrer">
                View roadmap
              </a> */}
              <a
                href="https://github.com/makeplane/plane"
                target="_blank"
                className="rounded-md border-2 border-black font-medium px-3 py-1.5 text-sm duration-300"
                rel="noopener noreferrer"
              >
                Star us on GitHub
              </a>
            </div>
          </div>
          <IssuesStats data={workspaceDashboardData} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <IssuesList issues={workspaceDashboardData?.overdue_issues} type="overdue" />
            <IssuesList issues={workspaceDashboardData?.upcoming_issues} type="upcoming" />
            <IssuesPieChart groupedIssues={workspaceDashboardData?.state_distribution} />
            <CompletedIssuesGraph
              issues={workspaceDashboardData?.completed_issues}
              month={month}
              setMonth={setMonth}
            />
          </div>
        </div>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspacePage;
