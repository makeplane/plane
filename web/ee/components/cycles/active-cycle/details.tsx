import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TCycleEstimateType, TCyclePlotType } from "@plane/types";
import { Loader, Row } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { DetailedEmptyState } from "@/components/empty-state";
import { TProgressChartData } from "@/helpers/cycle.helper";
// hooks
import { useCycle } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// local imports
import ActiveCycleChart from "./cycle-chart/chart";
import { formatActiveCycle } from "./formatter";
import Selection from "./selection";
import Summary from "./summary";
import useCycleDetails from "./use-cycle-details";

type ActiveCycleDetailProps = ReturnType<typeof useCycleDetails>;

const ActiveCycleDetail = observer((props: ActiveCycleDetailProps) => {
  // refs
  const ref = useRef<HTMLDivElement>(null);
  // states
  const [areaToHighlight, setAreaToHighlight] = useState<string>("");
  const [containerWidth, setContainerWidth] = useState<number>(0);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { plotType, estimatedType, getCycleById, currentProjectActiveCycleId } = useCycle();
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
  const computedEstimateType: TCycleEstimateType = (activeCycle.id && estimatedType[activeCycle.id]) || "issues";
  const activeCycleResolvedPath = useResolvedAssetPath({ basePath: "/empty-state/cycle/active" });

  const storeCycle = activeCycle.id
    ? getCycleById(activeCycle.id)
    : currentProjectActiveCycleId
      ? getCycleById(currentProjectActiveCycleId)
      : null;

  const cycleProgress =
    activeCycle &&
    formatActiveCycle({
      isTypeIssue: computedEstimateType === "issues",
      isBurnDown: computedPlotType === "burndown",
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
      <DetailedEmptyState
        title={t("project_cycles.empty_state.active.title")}
        description={t("project_cycles.empty_state.active.description")}
        assetPath={activeCycleResolvedPath}
      />
    );

  return (
    <div ref={ref} className="flex flex-col">
      <Row
        className={cn(`flex bg-custom-background-100 justify-between !pr-0 flex-col space-y-10`, {
          "md:flex-row-reverse space-y-0": containerWidth > 890,
        })}
      >
        <div className="h-full w-full flex-1">
          {cycleProgress !== null && !progressLoader ? (
            <div className="h-[430px]">
              <Selection
                plotType={computedPlotType}
                estimateType={computedEstimateType}
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
                estimateType={computedEstimateType}
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
          estimateType={computedEstimateType}
          plotType={computedPlotType}
          handleFiltersUpdate={handleFiltersUpdate}
          parentWidth={containerWidth}
        />
      </Row>
    </div>
  );
});
export default ActiveCycleDetail;
