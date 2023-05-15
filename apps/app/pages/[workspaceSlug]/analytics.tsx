import React, { Fragment } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// headless ui
import { Tab } from "@headlessui/react";
// services
import analyticsService from "services/analytics.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { CustomAnalytics, ScopeAndDemand } from "components/analytics";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
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

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Workspace Analytics" />
        </Breadcrumbs>
      }
      // right={
      //   <PrimaryButton
      //     className="flex items-center gap-2"
      //     onClick={() => {
      //       const e = new KeyboardEvent("keydown", { key: "p" });
      //       document.dispatchEvent(e);
      //     }}
      //   >
      //     <PlusIcon className="h-4 w-4" />
      //     Save Analytics
      //   </PrimaryButton>
      // }
    >
      <div className="h-full flex flex-col overflow-hidden bg-brand-base">
        <Tab.Group as={Fragment}>
          <Tab.List as="div" className="space-x-2 border-b border-brand-base px-5 py-3">
            {tabsList.map((tab) => (
              <Tab
                key={tab}
                className={({ selected }) =>
                  `rounded-3xl border border-brand-base px-4 py-2 text-xs hover:bg-brand-surface-2 ${
                    selected ? "bg-brand-surface-2" : ""
                  }`
                }
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
                fullScreen
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default Analytics;
