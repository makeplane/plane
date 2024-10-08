import { useEffect, useRef, useState } from "react";
import { cn } from "@plane/editor";
import { Loader, Row } from "@plane/ui";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateType } from "@/constants/empty-state";
import { TProgressChartData } from "@/helpers/cycle.helper";
import ActiveCycleChart from "./cycle-chart/chart";
import Selection from "./selection";
import Summary from "./summary";
import useCycleDetails from "./use-cycle-details";

type ActiveCycleDetailProps = ReturnType<typeof useCycleDetails>;

const ActiveCycleDetail = (props: ActiveCycleDetailProps) => {
  const [areaToHighlight, setAreaToHighlight] = useState<string>("");
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const {
    plotType,
    estimateType,
    handlePlotChange,
    handleEstimateChange,
    cycle: activeCycle,
    cycleProgress,
    progressLoader,
    handleFiltersUpdate,
    projectId,
  } = props;

  useEffect(() => {
    if (!ref.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setContainerWidth(ref.current!.offsetWidth);
    });
    resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect(); // clean up
  }, [ref.current]);

  if (!activeCycle) return <EmptyState type={EmptyStateType.PROJECT_CYCLE_ACTIVE} size="sm" />;

  return (
    <div ref={ref} className="flex flex-col">
      <Row
        className={cn(`flex bg-custom-background-100 justify-between !pr-0 flex-col space-y-10`, {
          "md:flex-row-reverse space-y-0": containerWidth > 620,
        })}
      >
        <div className="h-full w-full flex-1">
          {!progressLoader ? (
            <div className="h-[430px]">
              <Selection
                plotType={plotType}
                estimateType={estimateType}
                projectId={projectId}
                handlePlotChange={handlePlotChange}
                handleEstimateChange={handleEstimateChange}
                className={`${containerWidth < 620 && "!px-0"}`}
              />
              <ActiveCycleChart
                areaToHighlight={areaToHighlight}
                data={cycleProgress as TProgressChartData}
                cycle={activeCycle}
                isFullWidth={containerWidth < 620}
                estimateType={estimateType}
              />
            </div>
          ) : (
            <Loader className="px-page-x py-4 h-full">
              <Loader.Item width="100%" height="100%" />
            </Loader>
          )}
        </div>
        <Summary
          setAreaToHighlight={setAreaToHighlight}
          data={cycleProgress}
          plotType={plotType}
          estimateType={estimateType}
          progressLoader={progressLoader}
          handleFiltersUpdate={handleFiltersUpdate}
          parentWidth={containerWidth}
        />
      </Row>
    </div>
  );
};
export default ActiveCycleDetail;
