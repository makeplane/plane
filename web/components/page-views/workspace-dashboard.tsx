import { useEffect } from "react";
import { useTheme } from "next-themes";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useDashboard, useProject, useUser } from "hooks/store";
// components
import { TourRoot } from "components/onboarding";
import { UserGreetingsView } from "components/user";
import { IssuePeekOverview } from "components/issues";
import { DashboardWidgets } from "components/dashboard";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// ui
import { Spinner } from "@plane/ui";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";

export const WorkspaceDashboardView = observer(() => {
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    commandPalette: { toggleCreateProjectModal },
    eventTracker: { postHogEventTracker },
    router: { workspaceSlug },
  } = useApplication();
  const {
    currentUser,
    updateTourCompleted,
    membership: { currentWorkspaceRole },
  } = useUser();
  const { homeDashboardId, fetchHomeDashboardWidgets } = useDashboard();
  const { joinedProjectIds } = useProject();

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("onboarding", "dashboard", isLightMode);

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

  // fetch home dashboard widgets on workspace change
  useEffect(() => {
    if (!workspaceSlug) return;

    fetchHomeDashboardWidgets(workspaceSlug);
  }, [fetchHomeDashboardWidgets, workspaceSlug]);

  const isEditingAllowed = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  return (
    <>
      {homeDashboardId && joinedProjectIds ? (
        <>
          {joinedProjectIds.length > 0 ? (
            <div className="space-y-7 p-7 bg-custom-background-90 h-full w-full flex flex-col overflow-y-auto">
              <IssuePeekOverview />
              {currentUser && <UserGreetingsView user={currentUser} />}
              {currentUser && !currentUser.is_tour_completed && (
                <div className="fixed left-0 top-0 z-20 grid h-full w-full place-items-center bg-custom-backdrop bg-opacity-50 transition-opacity">
                  <TourRoot onComplete={handleTourCompleted} />
                </div>
              )}
              <DashboardWidgets />
            </div>
          ) : (
            <EmptyState
              image={emptyStateImage}
              title="Overview of your projects, activity, and metrics"
              description=" Welcome to Plane, we are excited to have you here. Create your first project and track your issues, and this
            page will transform into a space that helps you progress. Admins will also see items which help their team
            progress."
              primaryButton={{
                text: "Build your first project",
                onClick: () => toggleCreateProjectModal(true),
              }}
              comicBox={{
                title: "Everything starts with a project in Plane",
                description: "A project could be a product’s roadmap, a marketing campaign, or launching a new car.",
              }}
              size="lg"
              disabled={!isEditingAllowed}
            />
          )}
        </>
      ) : (
        <div className="h-full w-full grid place-items-center">
          <Spinner />
        </div>
      )}
    </>
  );
});
