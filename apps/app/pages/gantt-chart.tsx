import React from "react";
// components
import { GanttChartRoot } from "components/gantt-chart";

const GanttChart = () => {
  const data = [];

  // component for sidebar item
  const SidebarItemComponent = () => <div> </div>;

  // component for graph item
  const ItemComponent = () => <div> </div>;

  // drag item
  const dragItem = (
    type: "left" | "right" | "drag" | null = null,
    start_date: Date,
    end_date: Date
  ) => {
    if (type != null) {
      if (type === "left") {
      }
      if (type === "right") {
      }
      if (type === "drag") {
      }
      if (type === "left") {
      }
    }
    console.log("type", type);
    console.log("start_date", start_date);
    console.log("end_date", end_date);
  };

  return (
    <div>
      <div className="container mx-auto mt-10 h-[700px]">
        <GanttChartRoot title={"Issues"} data={null} />
      </div>
    </div>
  );
};

export default GanttChart;
