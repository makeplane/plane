/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
// plane imports
import { PillGroup } from "@makeplane/propel/components/pill";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { SingleOrArray, TFilterValue } from "@plane/types";
import { hasValidValue, cn } from "@plane/utils";

interface FilterItemContainerProps {
  children: React.ReactNode;
  conditionValue: SingleOrArray<TFilterValue>;
  showTransition: boolean;
  variant?: "default" | "error";
  tooltipContent?: string;
  /** The filtered property, naming the group for assistive tech. */
  label?: string;
}

export function FilterItemContainer(props: FilterItemContainerProps) {
  const { children, conditionValue, showTransition, variant = "default", tooltipContent, label } = props;
  // refs
  const itemRef = useRef<HTMLDivElement>(null);

  // effects
  useEffect(() => {
    if (!showTransition) return;

    const element = itemRef.current;
    if (!element) return;

    if (hasValidValue(conditionValue)) return;

    const applyInitialStyles = () => {
      element.style.opacity = "0";
      element.style.transform = "scale(0.95)";
    };

    const applyFinalStyles = () => {
      // Force a reflow to ensure the initial state is applied
      void element.offsetWidth;
      element.style.opacity = "1";
      element.style.transform = "scale(1)";
    };

    applyInitialStyles();
    applyFinalStyles();

    return () => {
      applyInitialStyles();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tooltip label={tooltipContent ?? ""} layout="stacked" side="bottom" disabled={!tooltipContent}>
      {/* One condition reads as one control: property, operator, value and remove are joined pill segments. */}
      <PillGroup
        size="md"
        aria-label={label}
        render={
          <div
            ref={itemRef}
            // an invalid condition outlines every segment in danger
            className={cn("max-w-full transition-all duration-200", {
              "*:border-danger-strong!": variant === "error",
            })}
          />
        }
      >
        {children}
      </PillGroup>
    </Tooltip>
  );
}
