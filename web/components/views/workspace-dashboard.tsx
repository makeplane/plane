import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { TourRoot } from "components/onboarding";
import { UserGreetingsView } from "components/user";
import { CompletedIssuesGraph, IssuesList, IssuesPieChart, IssuesStats } from "components/workspace";
import { PrimaryButton } from "components/ui";
// images
import emptyDashboard from "public/empty-state/dashboard.svg";

export const WorkspaceDashboardView = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store
  const { user: userStore, project: projectStore } = useMobxStore();
  const user = userStore.currentUser;
  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : null;
  const workspaceDashboardInfo = userStore.dashboardInfo;
  // states
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  // fetch user dashboard info
  useSWR(
    workspaceSlug ? `USER_WORKSPACE_DASHBOARD_${workspaceSlug}_${month}` : null,
    workspaceSlug ? () => userStore.fetchUserDashboardInfo(workspaceSlug.toString(), month) : null
  );

  const handleTourCompleted = () => {
    userStore.updateTourCompleted();
  };

  return (
    <>
      {/* {isProductUpdatesModalOpen && (
        <ProductUpdatesModal isOpen={isProductUpdatesModalOpen} setIsOpen={setIsProductUpdatesModalOpen} />
      )} */}
      {user && !user.is_tour_completed && (
        <div className="fixed top-0 left-0 h-full w-full bg-custom-backdrop bg-opacity-50 transition-opacity z-20 grid place-items-center">
          <TourRoot onComplete={handleTourCompleted} />
        </div>
      )}
      <div className="p-8 space-y-8">
        {user && <UserGreetingsView user={user} />}

        {projects ? (
          projects.length > 0 ? (
            <div className="flex flex-col gap-8">
              <IssuesStats data={workspaceDashboardInfo} />
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <IssuesList issues={workspaceDashboardInfo?.overdue_issues} type="overdue" />
                <IssuesList issues={workspaceDashboardInfo?.upcoming_issues} type="upcoming" />
                <IssuesPieChart groupedIssues={workspaceDashboardInfo?.state_distribution} />
                <CompletedIssuesGraph
                  issues={workspaceDashboardInfo?.completed_issues}
                  month={month}
                  setMonth={setMonth}
                />
              </div>
            </div>
          ) : (
            <div className="bg-custom-primary-100/5 flex justify-between gap-5 md:gap-8">
              <div className="p-5 md:p-8 pr-0">
                <h5 className="text-xl font-semibold">Create a project</h5>
                <p className="mt-2 mb-5">Manage your projects by creating issues, cycles, modules, views and pages.</p>
                <PrimaryButton
                  onClick={() => {
                    const e = new KeyboardEvent("keydown", {
                      key: "p",
                    });
                    document.dispatchEvent(e);
                  }}
                >
                  Create Project
                </PrimaryButton>
              </div>
              <div className="hidden md:block self-end overflow-hidden pt-8">
                <Image src={emptyDashboard} alt="Empty Dashboard" />
              </div>
            </div>
          )
        ) : null}
      </div>
    </>
  );
});
