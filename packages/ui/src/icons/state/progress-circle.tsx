import * as React from "react";

interface ProgressCircleProps {
  center: number;
  radius: number;
  color: string;
  strokeWidth: number;
  circumference: number;
  dashOffset: number;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  center,
  radius,
  color,
  strokeWidth,
  circumference,
  dashOffset,
}) => (
  <circle
    cx={center}
    cy={center}
    r={radius}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeDasharray={circumference}
    strokeDashoffset={dashOffset}
    strokeLinecap="round"
    transform={`rotate(-90 ${center} ${center})`}
  />
);
