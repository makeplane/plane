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

import * as React from "react";
import { cn } from "../utils";

// Types
export type CircularProgressIndicatorVariant = "default" | "with-label";

export interface CircularProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the circular progress indicator in pixels
   */
  size?: number;
  /**
   * Progress percentage (0-100)
   */
  percentage: number;
  /**
   * Width of the progress stroke
   */
  strokeWidth?: number;
  /**
   * Tailwind CSS class for stroke color
   */
  strokeColor?: string;
  /**
   * Whether to show segmented/dashed style (only for default variant)
   */
  segmented?: boolean;
  /**
   * Display variant of the progress indicator
   */
  variant?: CircularProgressIndicatorVariant;
  /**
   * Content to display inside the circle (only for default variant)
   */
  children?: React.ReactNode;
}

// Component
const CircularProgressIndicator = React.forwardRef(function CircularProgressIndicator(
  props: CircularProgressIndicatorProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    size = 50,
    percentage = 25,
    strokeWidth = 6,
    strokeColor = "stroke-success-secondary",
    segmented = false,
    variant = "default",
    children,
  } = props;

  const sqSize = size;
  const radius = (size - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const circumference = radius * Math.PI * 2;
  const dashOffset = circumference - (circumference * percentage) / 100;

  // For segmented style, create dashes around the circle
  const segmentDashArray = segmented ? "3 2" : undefined;
  const progressDashArray = segmented ? `3 2` : circumference;

  if (variant === "with-label") {
    return (
      <div ref={ref} className="flex items-center gap-2">
        <div className="relative">
          <svg width={size} height={size} viewBox={viewBox} fill="none">
            <circle
              className="fill-none stroke-(--border-color-strong)"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={`${strokeWidth}px`}
            />
            <circle
              className={cn("fill-none", strokeColor)}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={`${strokeWidth}px`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: dashOffset,
              }}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-13 font-medium text-secondary">{percentage}%</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <svg width={size} height={size} viewBox={viewBox} fill="none">
        <circle
          className="fill-none stroke-(--border-color-strong)"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          style={{
            strokeDasharray: segmentDashArray,
          }}
        />
        <circle
          className={cn("fill-none", strokeColor)}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            strokeDasharray: segmented ? progressDashArray : circumference,
            strokeDashoffset: dashOffset,
          }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {children}
      </div>
    </div>
  );
});

CircularProgressIndicator.displayName = "plane-ui-circular-progress-indicator";

export { CircularProgressIndicator };
