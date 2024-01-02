import { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useProject, useUser } from "hooks/store";
// components
import { TourRoot } from "components/onboarding";
import { UserGreetingsView } from "components/user";
import { CompletedIssuesGraph, IssuesList, IssuesPieChart, IssuesStats } from "components/workspace";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
// images
import { NewEmptyState } from "components/common/new-empty-state";
import emptyProject from "public/empty-state/dashboard_empty_project.webp";

export const WorkspaceDashboardView = observer(() => {
  // states
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    commandPalette: commandPaletteStore,
    eventTracker: { setTrackElement, postHogEventTracker },
  } = useApplication();
  const {
    currentUser,
    dashboardInfo: workspaceDashboardInfo,
    fetchUserDashboardInfo,
    updateTourCompleted,
    membership: { currentWorkspaceRole },
  } = useUser();
  const { workspaceProjectIds } = useProject();
  // fetch user dashboard info
  useSWR(
    workspaceSlug ? `USER_WORKSPACE_DASHBOARD_${workspaceSlug}_${month}` : null,
    workspaceSlug ? () => fetchUserDashboardInfo(workspaceSlug.toString(), month) : null
  );
  const isEditingAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  const handleTourCompleted = () => {
    updateTourCompleted()
      .then(() => {
        postHogEventTracker("USER_TOUR_COMPLETE", {
          user_id: currentUser?.id,
          email: currentUser?.email,
          state: "SUCCESS",
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <>
      {currentUser && !currentUser.is_tour_completed && (
        <div className="fixed left-0 top-0 z-20 grid h-full w-full place-items-center bg-custom-backdrop bg-opacity-50 transition-opacity">
          <TourRoot onComplete={handleTourCompleted} />
        </div>
      )}
      <div className="space-y-8 p-8">
        {currentUser && <UserGreetingsView user={currentUser} />}

        {workspaceProjectIds ? (
          workspaceProjectIds.length > 0 ? (
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
            <NewEmptyState
              image={emptyProject}
              title="Overview of your projects, activity, and metrics"
              description="When you have created a project and have issues assigned, you will see metrics, activity, and things you care about here. This is personalized to your role in projects, so project admins will see more than members."
              comicBox={{
                title: "Everything starts with a project in Plane",
                direction: "right",
                description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
              }}
              primaryButton={{
                text: "Build your first project",
                onClick: () => {
                  setTrackElement("DASHBOARD_PAGE");
                  commandPaletteStore.toggleCreateProjectModal(true);
                },
              }}
              disabled={!isEditingAllowed}
            />
          )
        ) : null}
      </div>
    </>
  );
});
