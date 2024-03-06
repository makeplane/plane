import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
// components
import { Spinner } from "@plane/ui";
import { DashboardWidgets } from "components/dashboard";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
import { IssuePeekOverview } from "components/issues";
import { TourRoot } from "components/onboarding";
import { UserGreetingsView } from "components/user";
// ui
// constants
import { WORKSPACE_EMPTY_STATE_DETAILS } from "constants/empty-state";
import { PRODUCT_TOUR_COMPLETED } from "constants/event-tracker";
import { EUserWorkspaceRoles } from "constants/workspace";
import { useApplication, useEventTracker, useDashboard, useProject, useUser } from "hooks/store";

export const WorkspaceDashboardView = observer(() => {
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { captureEvent, setTrackElement } = useEventTracker();
  const {
    commandPalette: { toggleCreateProjectModal },
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
        captureEvent(PRODUCT_TOUR_COMPLETED, {
          user_id: currentUser?.id,
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
      {currentUser && !currentUser.is_tour_completed && (
        <div className="fixed left-0 top-0 z-20 grid h-full w-full place-items-center bg-custom-backdrop bg-opacity-50 transition-opacity">
          <TourRoot onComplete={handleTourCompleted} />
        </div>
      )}
      {homeDashboardId && joinedProjectIds ? (
        <>
          {joinedProjectIds.length > 0 ? (
            <>
              <IssuePeekOverview />
              <div className="space-y-7 p-7 bg-custom-background-90 h-full w-full flex flex-col overflow-y-auto vertical-scrollbar scrollbar-lg">
                {currentUser && <UserGreetingsView user={currentUser} />}

                <DashboardWidgets />
              </div>
            </>
          ) : (
            <EmptyState
              image={emptyStateImage}
              title={WORKSPACE_EMPTY_STATE_DETAILS["dashboard"].title}
              description={WORKSPACE_EMPTY_STATE_DETAILS["dashboard"].description}
              primaryButton={{
                text: WORKSPACE_EMPTY_STATE_DETAILS["dashboard"].primaryButton.text,
                onClick: () => {
                  setTrackElement("Dashboard empty state");
                  toggleCreateProjectModal(true);
                },
              }}
              comicBox={{
                title: WORKSPACE_EMPTY_STATE_DETAILS["dashboard"].comicBox.title,
                description: WORKSPACE_EMPTY_STATE_DETAILS["dashboard"].comicBox.description,
              }}
              size="lg"
              disabled={!isEditingAllowed}
            />
          )}
        </>
      ) : (
        <div className="grid h-full w-full place-items-center">
          <Spinner />
        </div>
      )}
    </>
  );
});
