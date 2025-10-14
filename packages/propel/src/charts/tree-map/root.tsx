import React from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
// plane imports
import { TreeMapChartProps } from "@plane/types";
// local imports
import { cn } from "../../utils/classname";
import { CustomTreeMapContent } from "./map-content";
import { TreeMapTooltip } from "./tooltip";

export const TreeMapChart = React.memo((props: TreeMapChartProps) => {
  const { data, className = "w-full h-96", isAnimationActive = false, showTooltip = true } = props;
  return (
    <div className={cn(className)}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          nameKey="name"
          dataKey="value"
          stroke="currentColor"
          className="text-custom-background-100 bg-custom-background-100"
          content={<CustomTreeMapContent />}
          animationEasing="ease-out"
          isUpdateAnimationActive={isAnimationActive}
          animationBegin={100}
          animationDuration={500}
        >
          {showTooltip && (
            <Tooltip
              content={({ active, payload }) => <TreeMapTooltip active={active} payload={payload} />}
              cursor={{
                fill: "currentColor",
                className: "text-custom-background-90/80 cursor-pointer",
              }}
              wrapperStyle={{
                pointerEvents: "auto",
              }}
            />
          )}
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
});
TreeMapChart.displayName = "TreeMapChart";
