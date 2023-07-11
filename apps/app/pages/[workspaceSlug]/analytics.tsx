import React, { Fragment, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useProjects from "hooks/use-projects";
// headless ui
import { Tab } from "@headlessui/react";
// services
import analyticsService from "services/analytics.service";
import trackEventServices from "services/track-event.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { EmptyState } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyAnalytics from "public/empty-state/analytics.svg";
// types
import { IAnalyticsParams } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

const tabsList = ["Scope and Demand", "Custom Analytics"];

const Analytics = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUserAuth();
  const { projects } = useProjects();

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: watch("project"),
  };

  const { data: analytics, error: analyticsError } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

  const trackAnalyticsEvent = (tab: string) => {
    const eventPayload = {
      workspaceSlug: workspaceSlug?.toString(),
    };

    const eventType =
      tab === "Scope and Demand"
        ? "WORKSPACE_SCOPE_AND_DEMAND_ANALYTICS"
        : "WORKSPACE_CUSTOM_ANALYTICS";

    trackEventServices.trackAnalyticsEvent(eventPayload, eventType, user);
  };

  useEffect(() => {
    if (!workspaceSlug) return;

    if (user && workspaceSlug)
      trackEventServices.trackAnalyticsEvent(
        { workspaceSlug: workspaceSlug?.toString() },
        "WORKSPACE_SCOPE_AND_DEMAND_ANALYTICS",
        user
      );
  }, [user, workspaceSlug]);

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Workspace Analytics" />
        </Breadcrumbs>
      }
    >
      {projects ? (
        projects.length > 0 ? (
          <div className="h-full flex flex-col overflow-hidden bg-custom-background-100">
            <Tab.Group as={Fragment}>
              <Tab.List as="div" className="space-x-2 border-b border-custom-border-100 px-5 py-3">
                {tabsList.map((tab) => (
                  <Tab
                    key={tab}
                    className={({ selected }) =>
                      `rounded-3xl border border-custom-border-100 px-4 py-2 text-xs hover:bg-custom-background-80 ${
                        selected ? "bg-custom-background-80" : ""
                      }`
                    }
                    onClick={() => trackAnalyticsEvent(tab)}
                  >
                    {tab}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels as={Fragment}>
                <Tab.Panel as={Fragment}>
                  <ScopeAndDemand fullScreen />
                </Tab.Panel>
                <Tab.Panel as={Fragment}>
                  <CustomAnalytics
                    analytics={analytics}
                    analyticsError={analyticsError}
                    params={params}
                    control={control}
                    setValue={setValue}
                    user={user}
                    fullScreen
                  />
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        ) : (
          <EmptyState
            title="You can see your all projects' analytics here"
            description="Let's create your first project and analyse the stats with various graphs."
            image={emptyAnalytics}
            buttonText="New Project"
            buttonIcon={<PlusIcon className="h-4 w-4" />}
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "p",
              });
              document.dispatchEvent(e);
            }}
          />
        )
      ) : null}
    </WorkspaceAuthorizationLayout>
  );
};

export default Analytics;
