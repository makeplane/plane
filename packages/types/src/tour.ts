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

export type TProductTour = {
  work_items?: boolean;
  cycles?: boolean;
  modules?: boolean;
  intake?: boolean;
  pages?: boolean;
};

/**
 * Position options for tour popover relative to target element
 */
export type TourPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Definition for a single tour step
 */
export type TTourStep = {
  id: string;
  i18n_title: string;
  i18n_description: string;
  targetElement?: string;
  position?: TourPosition;
  asset?: string;
};

/**
 * Parameters for the useTour hook
 */
export type UseTourParams = {
  /** Unique identifier for the tour */
  tourId: string;
  /** Array of tour steps */
  steps: TTourStep[];
  /** Callback when tour is completed */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
  /** Callback when tour is closed (for any reason) */
  onClose?: () => void;
  /** Workspace slug (required for workspace_properties tours) */
  workspaceSlug?: string;
  /** Storage type for tour state persistence */
  storageType?: "user_profile" | "workspace_properties";
  /** Property key for workspace_properties tours (e.g., "work_items", "cycles") */
  propertyKey?: keyof TProductTour;
};

/**
 * Return value from the useTour hook
 */
export type UseTourReturn = {
  /** Whether the tour is currently open */
  isOpen: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** The current step data (translated) or null if no step */
  currentStepData: TTourStep | null;
  /** All tour steps with translations and theme-aware assets */
  translatedSteps: TTourStep[];
  /** Opens the tour */
  openTour: () => void;
  /** Closes the tour without marking as completed */
  closeTour: () => void;
  /** Advances to the next step (or completes if last step) */
  nextStep: () => void;
  /** Goes back to the previous step */
  previousStep: () => void;
  /** Skips/dismisses the tour and marks it as completed */
  skipTour: () => void;
  /** Jumps to a specific step by index */
  goToStep: (stepIndex: number) => void;
  /** Whether currently on the first step */
  isFirstStep: boolean;
  /** Whether currently on the last step */
  isLastStep: boolean;
  /** Total number of steps */
  totalSteps: number;
  /** Whether the tour has been completed */
  isCompleted: boolean;
};
