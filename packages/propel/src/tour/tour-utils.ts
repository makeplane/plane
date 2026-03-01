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

import type { TourConfig, TTourStep } from "./tour-types";

/**
 * Default configuration for tour component
 */
export const DEFAULT_TOUR_CONFIG: Required<TourConfig> = {
  popoverWidth: 440,
  popoverHeight: 408,
  positionOffset: 16,
  viewportPadding: 20,
  scrollBehavior: "smooth",
  scrollMargin: 50,
};

/**
 * Get the current step data from steps array
 * @param steps - Array of tour steps
 * @param currentStep - Current step index
 * @returns Current step object or null if invalid index
 */
export const getCurrentStepData = (steps: TTourStep[], currentStep: number): TTourStep | null => {
  if (currentStep < 0 || currentStep >= steps.length) {
    return null;
  }
  return steps[currentStep] || null;
};

/**
 * Check if the current step is the first step
 * @param currentStep - Current step index
 * @returns True if first step
 */
export const isFirstStep = (currentStep: number): boolean => {
  return currentStep === 0;
};

/**
 * Check if the current step is the last step
 * @param currentStep - Current step index
 * @param totalSteps - Total number of steps
 * @returns True if last step
 */
export const isLastStep = (currentStep: number, totalSteps: number): boolean => {
  return currentStep === totalSteps - 1;
};

/**
 * Merge user configuration with defaults
 * @param userConfig - User-provided configuration (partial)
 * @returns Complete configuration with defaults filled in
 */
export const mergeConfig = (userConfig: TourConfig = {}): Required<TourConfig> => {
  return {
    ...DEFAULT_TOUR_CONFIG,
    ...userConfig,
  };
};
