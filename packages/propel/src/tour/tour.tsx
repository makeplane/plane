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

import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils";
import { TourContent } from "./tour-content";
import { TourPulseIndicator } from "./tour-pulse-indicator";
import { getCurrentStepData, isFirstStep, isLastStep, mergeConfig } from "./tour-utils";
import { useTourKeyboard } from "./use-tour-keyboard";
import { useTourAnimation } from "./use-tour-animation";
import { useTourVisibility } from "./use-tour-visibility";
import type { TourProps } from "./tour-types";

/**
 * Tour - A guided tour/onboarding component with carousel transitions
 *
 * A fully controlled component for creating interactive product tours.
 * Features:
 * - Smooth carousel-style transitions between steps
 * - Animated pulse indicators on target elements
 * - Keyboard navigation (Escape, Arrow keys)
 * - Accessibility support (ARIA attributes, keyboard-only navigation)
 * - Portal rendering for z-index management
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(true);
 * const [currentStep, setCurrentStep] = useState(0);
 *
 * <Tour
 *   isOpen={isOpen}
 *   currentStep={currentStep}
 *   steps={tourSteps}
 *   onClose={() => setIsOpen(false)}
 *   onNext={() => setCurrentStep(s => Math.min(s + 1, tourSteps.length - 1))}
 *   onPrevious={() => setCurrentStep(s => Math.max(s - 1, 0))}
 * />
 * ```
 */
export const Tour: React.FC<TourProps> = (props) => {
  const {
    isOpen,
    currentStep,
    steps,
    onClose,
    onNext,
    onPrevious,
    onStepChange,
    config: userConfig,
    className = "",
    showPulseIndicator = true,
  } = props;

  const config = mergeConfig(userConfig);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Use hooks for better separation of concerns
  useTourKeyboard(isOpen, onClose, onNext, onPrevious);
  const { direction } = useTourAnimation(currentStep, onStepChange);
  const { shouldRender, isClosing, activeStepData } = useTourVisibility(isOpen, steps, currentStep);

  // Use portal to render at document body level
  if (typeof document === "undefined") return null;

  const renderContent = () => {
    // If not rendering, return null immediately
    if (!shouldRender) return null;

    // Use activeStepData if available
    const stepData = getCurrentStepData(steps, currentStep) || activeStepData;
    if (!stepData) return null;

    const isFirst = isFirstStep(currentStep);
    const isLast = isLastStep(currentStep, steps.length);

    const popoverClasses = cn(
      "bg-layer-2 rounded-lg shadow-lg border border-subtle",
      "p-0 outline-none fixed z-[9999] overflow-hidden",
      className
    );

    return (
      <div
        ref={popoverRef}
        className={cn(
          "shadow-raised-300",
          popoverClasses,
          isClosing ? "animate-tour-popover-exit" : "animate-tour-popover-enter"
        )}
        style={{
          width: `${config.popoverWidth}px`,
          minHeight: `${config.popoverHeight}px`,
          bottom: "1rem",
          right: "1rem",
        }}
        role="dialog"
        aria-labelledby="tour-title"
        aria-describedby="tour-description"
        aria-modal="true"
      >
        {/* Relative wrapper for absolute positioned content */}
        <div className="relative w-full h-full">
          <TourContent
            stepData={stepData}
            currentStep={currentStep}
            totalSteps={steps.length}
            isFirstStep={isFirst}
            isLastStep={isLast}
            direction={direction}
            onClose={onClose}
            onNext={onNext}
            onPrevious={onPrevious}
            config={config}
          />
        </div>
      </div>
    );
  };

  return createPortal(
    <>
      {/* Pulse indicator for target element */}
      {showPulseIndicator && (
        <TourPulseIndicator
          targetElement={activeStepData?.targetElement || null}
          isActive={isOpen && !!activeStepData?.targetElement}
        />
      )}

      {/* Tour popover - stays in bottom-right */}
      {renderContent()}
    </>,
    document.body
  );
};

Tour.displayName = "plane-ui-tour";
