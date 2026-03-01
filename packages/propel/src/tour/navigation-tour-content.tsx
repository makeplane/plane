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

import React from "react";
import { Button } from "../button";
import { CloseIcon } from "../icons";
import type { NavigationTourContentProps } from "./navigation-tour-types";

/**
 * NavigationTourContent - Displays navigation tour step content
 *
 * Simplified content component without image section, optimized for
 * positioned tooltips. Shows title, description, step counter, and
 * navigation controls.
 *
 * Layout:
 * - Close X button (top-right)
 * - Title
 * - Description
 * - Footer with step counter and navigation buttons
 *
 * @internal This component is used internally by the NavigationTour component
 */
export const NavigationTourContent: React.FC<NavigationTourContentProps> = ({
  stepData,
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onClose,
  onNext,
  onPrevious,
}) => {
  return (
    <div className="relative flex flex-col gap-4 p-3">
      {/* Close button - top right */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded hover:bg-layer-1 transition-colors"
        aria-label="Close tour"
        type="button"
      >
        <CloseIcon className="size-4 text-secondary" />
      </button>

      <div className="flex flex-col gap-1">
        {/* Title */}
        <h3 className="text-body-md-semibold text-primary pr-6" id="navigation-tour-title">
          {stepData.i18n_title}
        </h3>

        {/* Description */}
        <p className="text-body-sm-regular text-secondary" id="navigation-tour-description">
          {stepData.i18n_description}
        </p>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between">
        {/* Step counter */}
        <span className="text-caption-md-regular text-tertiary">
          Step {currentStep + 1} of {totalSteps}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <Button variant="ghost" size="sm" onClick={onPrevious}>
              Back
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onNext}>
            {isLastStep ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

NavigationTourContent.displayName = "plane-ui-navigation-tour-content";
