import React from "react";
// components
import { GnattChartRoot } from "components/gnatt-chart";

const GnattChart = () => {
  const data = [];

  return (
    <div>
      <div className="container mx-auto my-20">
        <GnattChartRoot />
      </div>
    </div>
  );
};

export default GnattChart;
