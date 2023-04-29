import React from "react";
// components
import { GanttChartRoot } from "components/gantt-chart";

const GanttChart = () => {
  const data = [];

  return (
    <div>
      <div className="container mx-auto my-20 px-10">
        <GanttChartRoot />
      </div>
    </div>
  );
};

export default GanttChart;
