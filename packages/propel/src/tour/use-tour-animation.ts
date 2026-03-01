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

import { useEffect, useRef, useState } from "react";

export type TourDirection = "next" | "prev" | null;

/**
 * Hook to manage tour step transition animations
 * Tracks direction (next/prev) and transition state
 *
 * @param currentStep - Current step index
 * @param onStepChange - Optional callback when step changes
 * @param duration - Total animation duration in ms (default: 250)
 */
export function useTourAnimation(currentStep: number, onStepChange?: (step: number) => void, duration: number = 250) {
  const [direction, setDirection] = useState<TourDirection>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousStepRef = useRef(currentStep);

  useEffect(() => {
    if (currentStep !== previousStepRef.current) {
      setIsTransitioning(true);

      // Determine direction
      if (currentStep > previousStepRef.current) {
        setDirection("next");
      } else if (currentStep < previousStepRef.current) {
        setDirection("prev");
      }

      // Call onStepChange callback
      onStepChange?.(currentStep);

      // Reset transition state after animation completes
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        previousStepRef.current = currentStep;
      }, duration); // Use configurable duration

      return () => clearTimeout(timer);
    }
  }, [currentStep, onStepChange, duration]);

  return { direction, isTransitioning };
}
