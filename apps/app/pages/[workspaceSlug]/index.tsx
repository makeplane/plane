import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// services
import userService from "services/user.service";
// hooks
import useUser from "hooks/use-user";
// components
import {
  CompletedIssuesGraph,
  IssuesList,
  IssuesPieChart,
  IssuesStats,
} from "components/workspace";
import { TourRoot } from "components/onboarding";
import { ProductUpdatesModal } from "components/ui";
// types
import { ICurrentUserResponse } from "types";
import type { NextPage } from "next";
// fetch-keys
import { CURRENT_USER, USER_WORKSPACE_DASHBOARD } from "constants/fetch-keys";

const WorkspacePage: NextPage = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [isProductUpdatesModalOpen, setIsProductUpdatesModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUser();

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
      {isProductUpdatesModalOpen && (
        <ProductUpdatesModal
          isOpen={isProductUpdatesModalOpen}
          setIsOpen={setIsProductUpdatesModalOpen}
        />
      )}
      {user && !user.is_onboarded && (
        <div className="fixed top-0 left-0 h-full w-full bg-custom-backdrop bg-opacity-50 transition-opacity z-20 grid place-items-center">
          <TourRoot
            onComplete={() => {
              userService.updateUserOnBoard({ userRole: user.role }, user).then(async () => {
                mutate<ICurrentUserResponse>(
                  CURRENT_USER,
                  (prevData) => {
                    if (!prevData) return prevData;

                    return {
                      ...prevData,
                      is_onboarded: true,
                    };
                  },
                  false
                );
              });
            }}
          />
        </div>
      )}
      <div className="p-8">
        <div className="flex flex-col gap-8">
          <div className="text-custom-text-200 flex flex-col justify-between gap-x-2 gap-y-6 rounded-lg border border-custom-border-100 bg-custom-background-100 px-4 py-6 md:flex-row md:items-center md:py-3">
            <p className="font-semibold">
              Plane is open source, support us by starring us on GitHub.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsProductUpdatesModalOpen(true)}
                className="rounded-md border-2 border-custom-border-100 px-3 py-1.5 text-sm font-medium duration-300"
              >
                {`What's New?`}
              </button>
              <a
                href="https://github.com/makeplane/plane"
                target="_blank"
                className="rounded-md border-2 border-custom-border-100 px-3 py-1.5 text-sm font-medium duration-300"
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
