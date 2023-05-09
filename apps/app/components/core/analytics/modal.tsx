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
      <div className={`absolute z-20 h-full w-full ${isOpen ? "block" : "hidden"}`}>
        <div className="h-full overflow-y-auto">
          <div className="flex h-full items-center justify-center p-2 text-center">
            <div className="relative h-full w-full transform overflow-y-hidden rounded-lg border border-brand-base bg-brand-surface-1 text-left transition-all">
              <div className="grid h-full grid-cols-4 overflow-y-auto">
                <div className="col-span-3 h-full">
                  {!analyticsError ? (
                    analytics && analytics.total > 0 ? (
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
                        <p className="text-sm">
                          There was some error in fetching the data. Please refresh the page and try
                          again.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <PrimaryButton onClick={() => router.reload()}>
                            Refresh page
                          </PrimaryButton>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
      </div>
    </>
  );
};
