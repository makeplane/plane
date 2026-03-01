/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type {
  TCycleEstimateSystemAdvanced,
  TCycleEstimateType,
  TCyclePlotType,
  TProgressChartData,
} from "@plane/types";
import { Loader, Row } from "@plane/ui";
// components
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { cn } from "@plane/utils";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCycle } from "@/hooks/store/use-cycle";
// local imports
import { ActiveCycleChart } from "./cycle-chart/chart";
import { formatActiveCycle } from "./helper";
import Selection from "./selection";
import Summary from "./summary";
import type { useActiveCycleDetails } from "./use-active-cycle-details";

type ActiveCycleDetailsProps = ReturnType<typeof useActiveCycleDetails>;

export const ActiveCycleDetails = observer(function ActiveCycleDetails(props: ActiveCycleDetailsProps) {
  // refs
  const ref = useRef<HTMLDivElement>(null);
  // states
  const [areaToHighlight, setAreaToHighlight] = useState<string>("");
  const [containerWidth, setContainerWidth] = useState<number>(0);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { plotType, estimatedType, getCycleById, currentProjectActiveCycleId } = useCycle();
  const { currentProjectEstimateType } = useProjectEstimates();
  const {
    handlePlotChange,
    handleEstimateChange,
    cycle: activeCycle,
    progressLoader,
    handleFiltersUpdate,
    projectId,
  } = props;
  // derived values
  const computedPlotType: TCyclePlotType = (activeCycle.id && plotType[activeCycle.id]) || "burndown";
  const cycleEstimateType: TCycleEstimateType = (activeCycle.id && estimatedType[activeCycle.id]) || "issues";
  const projectEstimateType =
    cycleEstimateType === "issues" ? "issues" : (currentProjectEstimateType as TCycleEstimateSystemAdvanced);

  const storeCycle = activeCycle.id
    ? getCycleById(activeCycle.id)
    : currentProjectActiveCycleId
      ? getCycleById(currentProjectActiveCycleId)
      : null;

  const cycleProgress =
    activeCycle &&
    formatActiveCycle({
      isTypeIssue: cycleEstimateType === "issues",
      isBurnDown: computedPlotType === "burndown",
      estimateType: projectEstimateType,
      cycle: {
        ...storeCycle,
        ...activeCycle,
      },
    });

  useEffect(() => {
    if (!ref.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setContainerWidth(ref.current!.offsetWidth);
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect(); // clean up
  }, [ref.current]);

  if (!activeCycle)
    return (
      <EmptyStateDetailed
        assetKey="cycle"
        title={t("project_cycles.empty_state.active.title")}
        description={t("project_cycles.empty_state.active.description")}
        rootClassName="py-10 h-auto"
      />
    );

  return (
    <div ref={ref} className="flex flex-col">
      <Row
        className={cn(`flex bg-surface-1 justify-between !pr-0 flex-col space-y-10`, {
          "md:flex-row-reverse space-y-0": containerWidth > 890,
        })}
      >
        <div className="h-full w-full flex-1">
          {cycleProgress !== null && !progressLoader ? (
            <div className="h-[430px]">
              <Selection
                plotType={computedPlotType}
                estimateType={cycleEstimateType}
                projectId={projectId}
                handlePlotChange={handlePlotChange}
                handleEstimateChange={handleEstimateChange}
                className={`${containerWidth < 890 && "!px-0"}`}
                cycleId={activeCycle.id}
              />
              <ActiveCycleChart
                areaToHighlight={areaToHighlight}
                data={cycleProgress as TProgressChartData}
                cycle={activeCycle}
                isFullWidth={containerWidth < 890}
                estimateType={projectEstimateType}
                plotType={computedPlotType}
                showAllTicks={containerWidth > 890}
                showToday
              />
            </div>
          ) : (
            <Loader className="px-page-x py-4 h-[430px]">
              <Loader.Item width="100%" height="100%" />
            </Loader>
          )}
        </div>
        <Summary
          setAreaToHighlight={setAreaToHighlight}
          data={cycleProgress}
          estimateType={projectEstimateType}
          plotType={computedPlotType}
          handleFiltersUpdate={handleFiltersUpdate}
          parentWidth={containerWidth}
        />
      </Row>
    </div>
  );
});
