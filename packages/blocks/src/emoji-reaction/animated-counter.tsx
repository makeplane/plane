/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { cn } from "@plane/utils";

export type AnimatedCounterProps = {
  count: number;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-caption-sm-regular",
  md: "text-body-xs-regular",
  lg: "text-body-sm-regular",
};

export function AnimatedCounter({ count, className, size = "md" }: AnimatedCounterProps) {
  // The number sliding out. It trails `count` and catches up once the slide finishes, so the
  // animation state is derived from the pair instead of being copied from `count` in an effect.
  const [prevCount, setPrevCount] = useState(count);
  const isAnimating = count !== prevCount;
  const direction = isAnimating ? (count > prevCount ? "up" : "down") : null;

  useEffect(() => {
    if (count === prevCount) return;
    // End the animation after the CSS transition
    const timer = setTimeout(() => setPrevCount(count), 250);
    return () => clearTimeout(timer);
  }, [count, prevCount]);

  const sizeClass = sizeClasses[size];

  return (
    <div className={cn("relative inline-flex min-w-2 items-center justify-center overflow-hidden", sizeClass)}>
      {/* Previous number sliding out */}
      {isAnimating && (
        <span
          key={`prev-${prevCount}-${count}`}
          className={cn(
            "absolute inset-0 flex items-center justify-center font-medium",
            "animate-slide-out",
            direction === "up" && "[--slide-out-dir:-100%]",
            direction === "down" && "[--slide-out-dir:100%]",
            sizeClass,
            {
              "animate-fade-out animate-slide-out": isAnimating && direction === "up",
              "animate-fade-out animate-slide-out-down": isAnimating && direction === "down",
            }
          )}
        >
          {prevCount}
        </span>
      )}

      {/* New number sliding in */}
      <span
        key={`current-${count}`}
        className={cn(
          "flex items-center justify-center font-medium",
          !isAnimating && "opacity-100",
          sizeClass,
          {
            "animate-slide-in-from-bottom": isAnimating && direction === "up",
            "animate-slide-in-from-top": isAnimating && direction === "down",
          },
          className
        )}
      >
        {count}
      </span>
    </div>
  );
}
