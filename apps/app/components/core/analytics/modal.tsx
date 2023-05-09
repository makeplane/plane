import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import analyticsService from "services/analytics.service";
// hooks
import useTheme from "hooks/use-theme";
// components
import {
  AnalyticsGraph,
  AnalyticsSidebar,
  AnalyticsTable,
  CreateUpdateAnalyticsModal,
} from "components/core";
// ui
import { PrimaryButton } from "components/ui";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
// types
import { IAnalyticsParams } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";
// constants
import { convertResponseToBarGraphData } from "constants/analytics";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const defaultValues: IAnalyticsParams = {
  x_axis: "priority",
  y_axis: "issue_count",
  segment: null,
  project: null,
};

export const AnalyticsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [saveAnalyticsModal, setSaveAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { collapsed } = useTheme();

  const { control, watch, setValue } = useForm<IAnalyticsParams>({ defaultValues });

  const params: IAnalyticsParams = {
    x_axis: watch("x_axis"),
    y_axis: watch("y_axis"),
    segment: watch("segment"),
    project: watch("project"),
  };

  const handleClose = () => {
    onClose();
  };
  const { data: analytics, error: analyticsError } = useSWR(
    workspaceSlug ? ANALYTICS(workspaceSlug.toString(), params) : null,
    workspaceSlug ? () => analyticsService.getAnalytics(workspaceSlug.toString(), params) : null
  );

  const yAxisKey = params.y_axis === "issue_count" ? "count" : "effort";
  const barGraphData = convertResponseToBarGraphData(
    analytics?.distribution,
    watch("segment") ? true : false,
    watch("y_axis")
  );

  return (
    <>
      <CreateUpdateAnalyticsModal
        isOpen={saveAnalyticsModal}
        handleClose={() => setSaveAnalyticsModal(false)}
        params={params}
      />
      <div
        className={`absolute z-20 h-full w-full bg-brand-surface-1 p-2 ${
          isOpen ? "block" : "hidden"
        }`}
      >
        <div className="relative flex h-full flex-col overflow-y-hidden rounded-lg border border-brand-base bg-brand-surface-1 text-left">
          <div className="flex items-center justify-between gap-2 border-b border-b-brand-base bg-brand-sidebar p-3 text-sm">
            <h3>Workspace Analytics</h3>
            <div>
              <button
                type="button"
                className="grid place-items-center p-1 text-brand-secondary hover:text-brand-base"
                onClick={handleClose}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid h-full grid-cols-4 overflow-y-auto">
            <div className="col-span-3">
              {!analyticsError ? (
                analytics ? (
                  analytics.total > 0 ? (
                    <div>
                      <AnalyticsGraph
                        analytics={analytics}
                        barGraphData={barGraphData}
                        params={params}
                        yAxisKey={yAxisKey}
                      />
                      <div className="m-5 mt-0">
                        <AnalyticsTable
                          analytics={analytics}
                          barGraphData={barGraphData}
                          params={params}
                          yAxisKey={yAxisKey}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid h-full place-items-center p-5">
                      <div className="space-y-4 text-brand-secondary">
                        <p className="text-sm">
                          No matching issues found. Try changing the parameters.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="grid h-full place-items-center p-5">
                    <div className="space-y-4 text-brand-secondary">
                      <p className="text-sm">Loading analytics...</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="grid h-full place-items-center p-5">
                  <div className="space-y-4 text-brand-secondary">
                    <p className="text-sm">
                      There was some error in fetching the data. Please refresh the page and try
                      again.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <PrimaryButton onClick={() => router.reload()}>Refresh page</PrimaryButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="h-full">
              <AnalyticsSidebar
                analytics={analytics}
                params={params}
                control={control}
                setValue={setValue}
                setSaveAnalyticsModal={setSaveAnalyticsModal}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
