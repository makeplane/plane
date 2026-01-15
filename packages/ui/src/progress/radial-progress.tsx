import type { FC } from "react";
import React, { useState, useEffect } from "react";

interface IRadialProgressBar {
  progress: number;
}

export function RadialProgressBar(props: IRadialProgressBar) {
  const { progress } = props;
  const [circumference, setCircumference] = useState(0);

  useEffect(() => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    setCircumference(circumference);
  }, []);

  const progressOffset = ((100 - progress) / 100) * circumference;

  return (
    <div className="relative h-4 w-4">
      <svg className="absolute left-0 top-0" viewBox="0 0 100 100">
        <circle
          className={"stroke-current opacity-10"}
          cx="50"
          cy="50"
          r="40"
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
        />
        <circle
          className={`stroke-current`}
          cx="50"
          cy="50"
          r="40"
          strokeWidth="12"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progressOffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
    </div>
  );
}
