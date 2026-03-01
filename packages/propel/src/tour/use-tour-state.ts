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

import { useState, useCallback } from "react";
import type { TTourStep } from "./tour-types";

/**
 * Simple state management hook for Tour component
 * Provides basic tour state and navigation functions
 *
 * @example
 * ```tsx
 * const tourState = useTourState(steps);
 *
 * return <Tour {...tourState} />;
 * ```
 */
export function useTourState(steps: TTourStep[], initialStep: number = 0) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialStep);

  const openTour = useCallback(() => {
    setIsOpen(true);
    setCurrentStep(0);
  }, []);

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextTourStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Last step - close tour
      setIsOpen(false);
    }
  }, [currentStep, steps.length]);

  const previousTourStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < steps.length) {
        setCurrentStep(step);
      }
    },
    [steps.length]
  );

  const resetTour = useCallback(() => {
    setCurrentStep(0);
  }, []);

  return {
    // State
    isOpen,
    currentStep,
    steps,

    // Actions for Tour component
    onClose: closeTour,
    onNext: nextTourStep,
    onPrevious: previousTourStep,

    // Additional helpers
    openTour,
    closeTour,
    nextTourStep,
    previousTourStep,
    goToStep,
    resetTour,
  };
}
