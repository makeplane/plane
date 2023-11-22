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
import { EmptyState } from "components/common";
// icons
import { Plus } from "lucide-react";
// assets
import emptyAnalytics from "public/empty-state/analytics.svg";
// constants
import { ANALYTICS_TABS } from "constants/analytics";
// type
import { NextPageWithLayout } from "types/app";

const AnalyticsPage: NextPageWithLayout = observer(() => {
  // store
  const {
    project: { workspaceProjects },
    commandPalette: { toggleCreateProjectModal },
  } = useMobxStore();

  return (
    <>
      {workspaceProjects && workspaceProjects.length > 0 ? (
        <div className="h-full flex flex-col overflow-hidden bg-custom-background-100">
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
          <EmptyState
            title="You can see your all projects' analytics here"
            description="Let's create your first project and analyze the stats with various graphs."
            image={emptyAnalytics}
            primaryButton={{
              icon: <Plus className="h-4 w-4" />,
              text: "New Project",
              onClick: () => toggleCreateProjectModal(true),
            }}
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
