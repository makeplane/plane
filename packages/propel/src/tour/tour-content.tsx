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

import React, { useState } from "react";
import { Button } from "../button";
import { CloseIcon } from "../icons";
import { cn } from "../utils";
import type { TourContentProps } from "./tour-types";

/**
 * TourContent - Displays tour step content with carousel animations
 *
 * Shows the tour step image, title, description, and navigation controls.
 * Supports smooth carousel-style transitions between steps.
 *
 * @internal This component is used internally by the Tour component
 */
export const TourContent: React.FC<TourContentProps> = (props) => {
  const { stepData, currentStep, totalSteps, isFirstStep, isLastStep, direction, onClose, onNext, onPrevious } = props;
  // Image loaded state - resets automatically on remount due to key={currentStep} on parent
  const [imageLoaded, setImageLoaded] = useState(false);

  // Determine animation class for content with smooth carousel effect
  let contentAnimationClass = "";
  if (direction === "next") contentAnimationClass = "animate-tour-carousel-slide-in-right";
  else if (direction === "prev") contentAnimationClass = "animate-tour-carousel-slide-in-left";
  else contentAnimationClass = "animate-tour-carousel-fade-in"; // Initial load

  return (
    <div key={currentStep} className={cn("absolute inset-0 flex flex-col")}>
      {/* Image preview */}
      <div
        className={cn(
          "relative h-[250px] w-full bg-black rounded-t-lg flex-shrink-0 overflow-hidden",
          contentAnimationClass
        )}
      >
        {stepData.asset && (
          <>
            {/* Loading blur placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 animate-pulse" />
            )}

            {/* Actual image */}
            <img
              src={stepData.asset}
              alt={stepData.i18n_title}
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-all duration-300",
                imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
              )}
              onLoad={() => setImageLoaded(true)}
              loading="eager"
            />
          </>
        )}

        {/* Close button */}
        <button
          className="absolute top-2 right-2 rounded-full size-6 flex items-center justify-center backdrop-blur-sm bg-white/30 hover:bg-white/50 transition-colors z-10"
          onClick={onClose}
          aria-label="Close tour"
        >
          <CloseIcon className="size-3.5 text-white" />
        </button>
      </div>

      {/* Content and navigation */}
      <div className="flex flex-col gap-5 justify-between px-4 py-5 bg-layer-2 flex-1 rounded-b-lg">
        {/* Step content */}
        <div className={cn("flex flex-col gap-2", contentAnimationClass)}>
          <span className="text-body-md-semibold" id="tour-title">
            {stepData.i18n_title}
          </span>
          <span className="text-body-sm-regular text-secondary" id="tour-description">
            {stepData.i18n_description}
          </span>
        </div>

        {/* Navigation controls */}
        <div className="flex justify-between items-center">
          {isFirstStep ? (
            <Button variant="primary" size="lg" onClick={onNext}>
              Get started
            </Button>
          ) : (
            <>
              <span className="text-caption-md-regular text-tertiary">
                Step {currentStep} of {totalSteps - 1}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="lg" onClick={onPrevious}>
                  Back
                </Button>
                <Button variant="primary" size="lg" onClick={onNext}>
                  {isLastStep ? "Done" : "Next"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

TourContent.displayName = "plane-ui-tour-content";
