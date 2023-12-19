import React, { Fragment, ReactElement } from "react";
import { observer } from "mobx-react-lite";
import { Tab } from "@headlessui/react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import { AppLayout } from "layouts/app-layout";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
import { WorkspaceAnalyticsHeader } from "components/headers";
import { NewEmptyState } from "components/common/new-empty-state";
// icons
import { Plus } from "lucide-react";
// assets
import emptyAnalytics from "public/empty-state/empty_analytics.webp";
// constants
import { ANALYTICS_TABS } from "constants/analytics";
import { EUserWorkspaceRoles } from "constants/workspace";
// type
import { NextPageWithLayout } from "types/app";

const AnalyticsPage: NextPageWithLayout = observer(() => {
  // store
  const {
    project: { workspaceProjects },
    commandPalette: { toggleCreateProjectModal },
    trackEvent: { setTrackElement },
    user: { currentProjectRole },
  } = useMobxStore();

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <>
      {workspaceProjects && workspaceProjects.length > 0 ? (
        <div className="flex h-full flex-col overflow-hidden bg-custom-background-100">
          <Tab.Group as={Fragment}>
            <Tab.List as="div" className="space-x-2 border-b border-custom-border-200 px-5 py-3">
              {ANALYTICS_TABS.map((tab) => (
                <Tab
                  key={tab.key}
                  className={({ selected }) =>
                    `rounded-3xl border border-custom-border-200 px-4 py-2 text-xs hover:bg-custom-background-80 ${
                      selected ? "bg-custom-background-80" : ""
                    }`
                  }
                  onClick={() => {}}
                >
                  {tab.title}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels as={Fragment}>
              <Tab.Panel as={Fragment}>
                <ScopeAndDemand fullScreen />
              </Tab.Panel>
              <Tab.Panel as={Fragment}>
                <CustomAnalytics fullScreen />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      ) : (
        <>
          <NewEmptyState
            title="Track progress, workloads, and allocations. Spot trends, remove blockers, and move work faster."
            description="See scope versus demand, estimates, and scope creep. Get performance by team members and teams, and make sure your project runs on time."
            image={emptyAnalytics}
            comicBox={{
              title: "Analytics works best with Cycles + Modules",
              description:
                "First, timebox your issues into Cycles and, if you can, group issues that span more than a cycle into Modules. Check out both on the left nav.",
              direction: "right",
              extraPadding: true,
            }}
            primaryButton={{
              icon: <Plus className="h-4 w-4" />,
              text: "Create Cycles and Modules first",
              onClick: () => {
                setTrackElement("ANALYTICS_EMPTY_STATE");
                toggleCreateProjectModal(true);
              },
            }}
            disabled={!isEditingAllowed}
          />
        </>
      )}
    </>
  );
});

AnalyticsPage.getLayout = function getLayout(page: ReactElement) {
  return <AppLayout header={<WorkspaceAnalyticsHeader />}>{page}</AppLayout>;
};

export default AnalyticsPage;
