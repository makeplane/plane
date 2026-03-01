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
 * Navigation Tour component type definitions
 * Provides a positioned tooltip tour component for highlighting navigation features
 */

/**
 * Arrow placement options for the tooltip pointer
 */
export type ArrowPlacement = "top" | "bottom" | "left" | "right";

/**
 * Position preferences for tooltip relative to target element
 * Extended from the base tour position type
 */
export type NavigationTourPosition =
  | "top-left"
  | "top-right"
  | "top-center"
  | "bottom-left"
  | "bottom-right"
  | "bottom-center"
  | "left-top"
  | "left-bottom"
  | "left-center"
  | "right-top"
  | "right-bottom"
  | "right-center";

/**
 * Definition for a single navigation tour step
 * Compatible with ITourStep from constants
 */
export interface NavigationTourStep {
  /** Unique identifier for the step */
  id: string;
  /** Step title */
  i18n_title: string;
  /** Step description/content */
  i18n_description: string;
  /** CSS selector for target element to highlight (required for navigation tour) */
  targetElement?: string;
  /** Position preference relative to target */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Optional asset/image URL (not used in navigation tour) */
  asset?: string;
}

/**
 * Configuration options for navigation tour behavior and appearance
 */
export interface NavigationTourConfig {
  /** Width of tooltip in pixels (default: 320px) */
  tooltipWidth?: number;
  /** Maximum height of tooltip in pixels (default: auto) */
  tooltipMaxHeight?: number;
  /** Gap between target element and tooltip in pixels (default: 12px) */
  positionOffset?: number;
  /** Arrow pointer size in pixels (default: 8px) */
  arrowSize?: number;
  /** Minimum padding from viewport edges in pixels (default: 16px) */
  viewportPadding?: number;
}

/**
 * Controller interface for managing navigation tour state
 * All state must be managed externally (controlled component pattern)
 */
export interface NavigationTourController {
  /** Whether the tour is currently open/visible */
  isOpen: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** Array of tour steps to display */
  steps: NavigationTourStep[];
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
 * Props for the main NavigationTour component
 */
export interface NavigationTourProps extends NavigationTourController {
  /** Optional configuration overrides */
  config?: NavigationTourConfig;
  /** Optional additional CSS classes for tooltip */
  className?: string;
}

/**
 * Internal positioning result from positioning calculations
 * @internal
 */
export interface TooltipPosition {
  /** Top coordinate in pixels */
  top: number;
  /** Left coordinate in pixels */
  left: number;
  /** Arrow placement direction */
  arrowPlacement: ArrowPlacement;
  /** Arrow offset from tooltip edge in pixels */
  arrowOffset: number;
}

/**
 * Internal props for NavigationTourContent component
 * @internal
 */
export interface NavigationTourContentProps {
  stepData: NavigationTourStep;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Internal props for NavigationTourArrow component
 * @internal
 */
export interface NavigationTourArrowProps {
  /** Arrow placement direction */
  placement: ArrowPlacement;
  /** Offset from tooltip edge in pixels */
  offset: number;
  /** Arrow size in pixels */
  size: number;
}
