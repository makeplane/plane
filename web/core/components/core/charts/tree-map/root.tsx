import React from "react";
import { Treemap, ResponsiveContainer } from "recharts";
// plane imports
import { TreeMapChartProps } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { CustomTreeMapContent } from "./map-content";

export const TreeMapChart = React.memo((props: TreeMapChartProps) => {
  const { data, className = "w-full h-96", isAnimationActive = false } = props;
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
        />
      </ResponsiveContainer>
    </div>
  );
});
TreeMapChart.displayName = "TreeMapChart";
