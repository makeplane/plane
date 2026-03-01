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

import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { ILLUSTRATION_COLOR_TOKEN_MAP } from "../empty-state";
import { cn } from "../utils";
import { NavigationTourContent } from "./navigation-tour-content";
import { useTourAnimation } from "./use-tour-animation";
import { useTourKeyboard } from "./use-tour-keyboard";
import { useTourVisibility } from "./use-tour-visibility";
import type {
  NavigationTourProps,
  NavigationTourConfig,
  TooltipPosition,
  NavigationTourPosition,
} from "./navigation-tour-types";

const DOT_SIZE = 8;
const DOT_OFFSET = -4;

const DEFAULT_CONFIG: Required<NavigationTourConfig> = {
  tooltipWidth: 320,
  tooltipMaxHeight: 400,
  positionOffset: 40,
  arrowSize: 8,
  viewportPadding: 16,
};

const POSITION_FALLBACKS: Record<NavigationTourPosition, NavigationTourPosition[]> = {
  "bottom-center": ["bottom-center", "top-center", "right-center", "left-center"],
  "top-center": ["top-center", "bottom-center", "right-center", "left-center"],
  "left-center": ["left-center", "right-center", "bottom-center", "top-center"],
  "right-center": ["right-center", "left-center", "bottom-center", "top-center"],
  "bottom-left": ["bottom-left", "bottom-center", "top-left", "top-center"],
  "bottom-right": ["bottom-right", "bottom-center", "top-right", "top-center"],
  "top-left": ["top-left", "top-center", "bottom-left", "bottom-center"],
  "top-right": ["top-right", "top-center", "bottom-right", "bottom-center"],
  "left-top": ["left-top", "left-center", "right-top", "right-center"],
  "left-bottom": ["left-bottom", "left-center", "right-bottom", "right-center"],
  "right-top": ["right-top", "right-center", "left-top", "left-center"],
  "right-bottom": ["right-bottom", "right-center", "left-bottom", "left-center"],
};

function calculateCoordinatesForPosition(
  position: NavigationTourPosition,
  targetRect: DOMRect,
  config: Required<NavigationTourConfig>
): TooltipPosition {
  const { tooltipWidth, positionOffset } = config;
  const estimatedHeight = 200;

  let top = 0;
  let left = 0;

  if (position === "bottom-center") {
    top = targetRect.bottom + positionOffset;
    left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
  } else if (position === "bottom-left") {
    top = targetRect.bottom + positionOffset;
    left = targetRect.left;
  } else if (position === "bottom-right") {
    top = targetRect.bottom + positionOffset;
    left = targetRect.right - tooltipWidth;
  } else if (position === "top-center") {
    top = targetRect.top - estimatedHeight - positionOffset;
    left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
  } else if (position === "top-left") {
    top = targetRect.top - estimatedHeight - positionOffset;
    left = targetRect.left;
  } else if (position === "top-right") {
    top = targetRect.top - estimatedHeight - positionOffset;
    left = targetRect.right - tooltipWidth;
  } else if (position === "right-center") {
    top = targetRect.top + targetRect.height / 2 - estimatedHeight / 2;
    left = targetRect.right + positionOffset;
  } else if (position === "right-top") {
    top = targetRect.top;
    left = targetRect.right + positionOffset;
  } else if (position === "right-bottom") {
    top = targetRect.bottom - estimatedHeight;
    left = targetRect.right + positionOffset;
  } else if (position === "left-center") {
    top = targetRect.top + targetRect.height / 2 - estimatedHeight / 2;
    left = targetRect.left - tooltipWidth - positionOffset;
  } else if (position === "left-top") {
    top = targetRect.top;
    left = targetRect.left - tooltipWidth - positionOffset;
  } else if (position === "left-bottom") {
    top = targetRect.bottom - estimatedHeight;
    left = targetRect.left - tooltipWidth - positionOffset;
  }

  return { top, left, arrowPlacement: "bottom", arrowOffset: 0 };
}

function isPositionValid(position: TooltipPosition, config: Required<NavigationTourConfig>): boolean {
  const { tooltipWidth, viewportPadding } = config;
  const estimatedHeight = 200;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const fitsHorizontally =
    position.left >= viewportPadding && position.left + tooltipWidth <= viewportWidth - viewportPadding;

  const fitsVertically =
    position.top >= viewportPadding && position.top + estimatedHeight <= viewportHeight - viewportPadding;

  return fitsHorizontally && fitsVertically;
}

function calculateBestPosition(
  targetRect: DOMRect,
  preference: NavigationTourPosition,
  config: Required<NavigationTourConfig>
): TooltipPosition {
  const attempts = POSITION_FALLBACKS[preference] || ["bottom-center"];

  for (const pos of attempts) {
    const coords = calculateCoordinatesForPosition(pos, targetRect, config);
    if (isPositionValid(coords, config)) {
      return coords;
    }
  }

  return calculateCoordinatesForPosition(preference, targetRect, config);
}

function normalizePosition(position?: string): NavigationTourPosition {
  const validPositions = [
    "top-left",
    "top-right",
    "top-center",
    "bottom-left",
    "bottom-right",
    "bottom-center",
    "left-top",
    "left-bottom",
    "left-center",
    "right-top",
    "right-bottom",
    "right-center",
  ];

  if (position && validPositions.includes(position)) {
    return position as NavigationTourPosition;
  }

  return "bottom-center";
}

function calculateLinePath(dotPos: { top: number; left: number }, tooltipPos: { top: number; left: number }): string {
  const dotCenterX = dotPos.left + DOT_SIZE / 2;
  const dotCenterY = dotPos.top + DOT_SIZE / 2;
  const isTooltipAbove = tooltipPos.top < dotCenterY;

  if (isTooltipAbove) {
    const tooltipBottomY = tooltipPos.top + 200;
    return `M ${dotCenterX} ${dotCenterY} L ${dotCenterX} ${tooltipBottomY}`;
  } else {
    return `M ${dotCenterX} ${dotCenterY} L ${dotCenterX} ${tooltipPos.top}`;
  }
}

/**
 * NavigationTour - Smooth coordinated animations using layout animations
 */
export const NavigationTour: React.FC<NavigationTourProps> = (props) => {
  const { isOpen, currentStep, steps, onClose, onNext, onPrevious, config: userConfig, className = "" } = props;

  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);

  // Animation state management
  const [displayedStepIndex, setDisplayedStepIndex] = useState(currentStep);
  const [isContentTransitioning, setIsContentTransitioning] = useState(false);
  const { isTransitioning } = useTourAnimation(currentStep, undefined, 250);

  const stepData = steps[displayedStepIndex];
  const targetSelector = stepData?.targetElement;

  const [positions, setPositions] = useState<{
    tooltip: { top: number; left: number };
    dot: { top: number; left: number };
  } | null>(null);

  const rafTimeoutRef = useRef<number>();
  const linePathRef = useRef<SVGPathElement>(null);

  useTourKeyboard(isOpen, onClose, onNext, onPrevious);
  useTourVisibility(isOpen, steps, currentStep);

  // Content transition effect - orchestrates displayedStepIndex update
  useEffect(() => {
    if (!isTransitioning) {
      setDisplayedStepIndex(currentStep);
      return;
    }

    setIsContentTransitioning(true);

    const contentSwitchTimer = setTimeout(() => {
      setDisplayedStepIndex(currentStep);
      setIsContentTransitioning(false);
    }, 100);

    return () => clearTimeout(contentSwitchTimer);
  }, [currentStep, isTransitioning]);

  // Main position calculation effect
  useEffect(() => {
    if (!isOpen || !targetSelector) {
      return;
    }

    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[NavigationTour] Target element not found: ${targetSelector}`);
      }
      setPositions(null);
      return;
    }

    // INSTANT scroll instead of smooth
    targetElement.scrollIntoView({
      behavior: "auto",
      block: "center",
      inline: "center",
    });

    // IMMEDIATE position calculation with requestAnimationFrame
    const rafId = requestAnimationFrame(() => {
      const targetRect = targetElement.getBoundingClientRect();
      const normalizedPosition = normalizePosition(stepData?.position);

      const tooltipPos = calculateBestPosition(targetRect, normalizedPosition, mergedConfig);
      const dotPos = {
        top: targetRect.bottom + DOT_OFFSET,
        left: targetRect.left + targetRect.width / 2 - DOT_SIZE / 2,
      };

      // Update positions
      setPositions({
        tooltip: { top: tooltipPos.top, left: tooltipPos.left },
        dot: dotPos,
      });
    });

    // Handle resize/scroll
    const handleUpdate = () => {
      if (rafTimeoutRef.current) {
        cancelAnimationFrame(rafTimeoutRef.current);
      }

      rafTimeoutRef.current = requestAnimationFrame(() => {
        const targetRect = targetElement.getBoundingClientRect();
        const normalizedPosition = normalizePosition(stepData?.position);
        const tooltipPos = calculateBestPosition(targetRect, normalizedPosition, mergedConfig);
        const dotPos = {
          top: targetRect.bottom + DOT_OFFSET,
          left: targetRect.left + targetRect.width / 2 - DOT_SIZE / 2,
        };
        setPositions({
          tooltip: { top: tooltipPos.top, left: tooltipPos.left },
          dot: dotPos,
        });
      });
    };

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      cancelAnimationFrame(rafId);
      if (rafTimeoutRef.current) {
        cancelAnimationFrame(rafTimeoutRef.current);
      }
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [targetSelector, isOpen, stepData?.position, mergedConfig, currentStep]);

  if (!isOpen || !positions || typeof document === "undefined") {
    return null;
  }

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const tooltipWidth = mergedConfig.tooltipWidth;
  const linePath = calculateLinePath(positions.dot, positions.tooltip);

  // Derive animation state - show when positions are available
  const shouldAnimate = isOpen && positions !== null;

  const tooltipClasses = cn(
    "fixed z-[9999] bg-layer-2 rounded-lg shadow-raised-300 border border-subtle",
    "transition-all duration-[250ms] ease-out",
    shouldAnimate ? "opacity-100 scale-100" : "opacity-0 scale-95",
    className
  );

  const contentWrapperClasses = cn(
    "transition-opacity",
    isContentTransitioning
      ? "duration-100 ease-out opacity-0"
      : isTransitioning
        ? "duration-150 ease-in opacity-100"
        : "opacity-100"
  );

  const lineClasses = cn(
    "fixed pointer-events-none z-[9998]",
    "transition-opacity duration-[250ms] ease-out",
    shouldAnimate ? "opacity-30" : "opacity-0"
  );

  const dotClasses = cn(
    "fixed pointer-events-none z-[9999]",
    "transition-all duration-[250ms] ease-out",
    shouldAnimate ? "opacity-100 scale-100" : "opacity-0 scale-0"
  );

  return createPortal(
    <>
      {isOpen && positions && (
        <div key={`tour-step-${currentStep}`}>
          {/* Connecting line */}
          {positions.dot && positions.tooltip && (
            <>
              <svg
                className={lineClasses}
                style={{
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                }}
              >
                <path
                  ref={linePathRef}
                  d={linePath}
                  stroke={ILLUSTRATION_COLOR_TOKEN_MAP.stroke.tertiary}
                  strokeWidth="2"
                  fill="none"
                  style={{
                    strokeDasharray: "1000",
                    strokeDashoffset: shouldAnimate ? "0" : "1000",
                    transition: "stroke-dashoffset 250ms ease-out",
                  }}
                />
              </svg>

              {/* Dot indicator */}
              <div
                className={dotClasses}
                style={{
                  top: positions.dot.top,
                  left: positions.dot.left,
                }}
              >
                <span className="block size-2 rounded-full bg-[var(--illustration-stroke-tertiary)]" />
              </div>
            </>
          )}

          {/* Tooltip */}
          <div
            className={tooltipClasses}
            style={{
              top: positions.tooltip.top,
              left: positions.tooltip.left,
              width: `${tooltipWidth}px`,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="navigation-tour-title"
            aria-describedby="navigation-tour-description"
          >
            <div className={contentWrapperClasses}>
              <NavigationTourContent
                stepData={stepData}
                currentStep={currentStep}
                totalSteps={steps.length}
                isFirstStep={isFirst}
                isLastStep={isLast}
                onClose={onClose}
                onNext={onNext}
                onPrevious={onPrevious}
              />
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

NavigationTour.displayName = "plane-ui-navigation-tour";
