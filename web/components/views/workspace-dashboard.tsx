import { useState } from "react";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { TourRoot } from "components/onboarding";
import { UserGreetingsView } from "components/user";

export const WorkspaceDashboardView = () => {
  // store
  const { user: userStore } = useMobxStore();
  const user = userStore.currentUser;
  // states
  const [month, setMonth] = useState(new Date().getMonth() + 1);

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
};
