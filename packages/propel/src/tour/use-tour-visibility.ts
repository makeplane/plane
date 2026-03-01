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

import { useEffect, useState } from "react";
import { getCurrentStepData } from "./tour-utils";
import type { TTourStep } from "./tour-types";

/**
 * Hook to manage tour visibility and exit animations
 * Handles delayed unmounting for smooth exit animations
 */
export function useTourVisibility(isOpen: boolean, steps: TTourStep[], currentStep: number) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeStepData, setActiveStepData] = useState(getCurrentStepData(steps, currentStep));

  // Handle open/close with exit animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200); // Match exit animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Update active step data
  useEffect(() => {
    const stepData = getCurrentStepData(steps, currentStep);
    if (stepData) {
      setActiveStepData(stepData);
    }
  }, [steps, currentStep]);

  return { shouldRender, isClosing, activeStepData };
}
