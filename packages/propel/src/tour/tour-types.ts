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

/**
 * Tour component type definitions
 * Provides a fully controlled tour/onboarding component
 */

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
 * Configuration options for tour behavior and appearance
 */
export interface TourConfig {
  /** Width of tour popover in pixels */
  popoverWidth?: number;
  /** Minimum height of tour popover in pixels */
  popoverHeight?: number;
  /** Gap between target element and popover in pixels */
  positionOffset?: number;
  /** Minimum padding from viewport edges in pixels */
  viewportPadding?: number;
  /** Scroll behavior when navigating to target elements */
  scrollBehavior?: ScrollBehavior;
  /** Extra margin when auto-scrolling to target elements */
  scrollMargin?: number;
}

/**
 * Controller interface for managing tour state
 * All state must be managed externally (controlled component pattern)
 */
export interface TourController {
  /** Whether the tour is currently open/visible */
  isOpen: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** Array of tour steps to display */
  steps: TTourStep[];
  /** Callback when tour is closed/dismissed */
  onClose: () => void;
  /** Callback when user advances to next step */
  onNext: () => void;
  /** Callback when user goes back to previous step */
  onPrevious: () => void;
  /** Optional callback when step changes (called with new step index) */
  onStepChange?: (step: number) => void;
}

/**
 * Props for the main Tour component
 */
export interface TourProps extends TourController {
  /** Optional configuration overrides */
  config?: TourConfig;
  /** Optional additional CSS classes for popover */
  className?: string;
  /** Whether to show pulse indicator on target elements */
  showPulseIndicator?: boolean;
}

/**
 * Internal props for TourContent component
 * @internal
 */
export interface TourContentProps {
  stepData: TTourStep;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  direction: "next" | "prev" | null;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  config: Required<TourConfig>;
}

/**
 * Internal props for TourPulseIndicator component
 * @internal
 */
export interface TourPulseIndicatorProps {
  /** CSS selector for target element */
  targetElement: string | null;
  /** Whether the indicator is active/visible */
  isActive: boolean;
}
