"use client";

import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { Tab } from "@headlessui/react";
// components
import { Header, EHeaderVariant } from "@plane/ui";
import { CustomAnalytics, ScopeAndDemand } from "@/components/analytics";
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
// constants
import { ANALYTICS_TABS } from "@/constants/analytics";
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette, useEventTracker, useProject, useWorkspace } from "@/hooks/store";

const AnalyticsPage = observer(() => {
  const searchParams = useSearchParams();
  const analytics_tab = searchParams.get("analytics_tab");
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { workspaceProjectIds, loader } = useProject();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Analytics` : undefined;

  // TODO: refactor loader implementation
  return (
    <>
      <PageHead title={pageTitle} />
      {workspaceProjectIds && (
        <>
          {workspaceProjectIds.length > 0 || loader ? (
            <div className="flex h-full flex-col overflow-hidden bg-custom-background-100">
              <Tab.Group as={Fragment} defaultIndex={analytics_tab === "custom" ? 1 : 0}>
                <Header variant={EHeaderVariant.SECONDARY}>
                  <Tab.List as="div" className="flex space-x-2 h-full">
                    {ANALYTICS_TABS.map((tab) => (
                      <Tab key={tab.key} as={Fragment}>
                        {({ selected }) => (
                          <button
                            className={`text-sm group relative flex items-center gap-1 h-full px-3 cursor-pointer transition-all font-medium outline-none  ${
                              selected ? "text-custom-primary-100 " : "hover:text-custom-text-200"
                            }`}
                          >
                            {tab.title}
                            <div
                              className={`border absolute bottom-0 right-0 left-0 rounded-t-md ${selected ? "border-custom-primary-100" : "border-transparent group-hover:border-custom-border-200"}`}
                            />
                          </button>
                        )}
                      </Tab>
                    ))}
                  </Tab.List>
                </Header>
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
            <EmptyState
              type={EmptyStateType.WORKSPACE_ANALYTICS}
              primaryButtonOnClick={() => {
                setTrackElement("Analytics empty state");
                toggleCreateProjectModal(true);
              }}
            />
          )}
        </>
      )}
    </>
  );
});

export default AnalyticsPage;
