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
import type { NavigationTourArrowProps } from "./navigation-tour-types";

/**
 * NavigationTourArrow - Arrow pointer component for navigation tour
 *
 * Uses CSS border trick to create a lightweight arrow pointer that
 * visually connects the tooltip to the target element.
 *
 * The arrow is positioned absolutely relative to the tooltip container
 * and points in the direction of the target element.
 *
 * @internal This component is used internally by the NavigationTour component
 */
export const NavigationTourArrow: React.FC<NavigationTourArrowProps> = ({ placement, offset, size }) => {
  // Base styles for the arrow
  const baseStyles: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    borderStyle: "solid",
  };

  // Arrow color matching tooltip background (bg-layer-2 in dark mode)
  const arrowColor = "rgb(24, 24, 27)";

  // Calculate arrow styles based on placement direction
  let arrowStyles: React.CSSProperties = { ...baseStyles };

  if (placement === "top") {
    // Arrow pointing upward (for tooltip positioned below target)
    arrowStyles = {
      ...baseStyles,
      top: -size,
      left: offset - size,
      borderWidth: `0 ${size}px ${size}px ${size}px`,
      borderColor: `transparent transparent ${arrowColor} transparent`,
    };
  } else if (placement === "bottom") {
    // Arrow pointing downward (for tooltip positioned above target)
    arrowStyles = {
      ...baseStyles,
      bottom: -size,
      left: offset - size,
      borderWidth: `${size}px ${size}px 0 ${size}px`,
      borderColor: `${arrowColor} transparent transparent transparent`,
    };
  } else if (placement === "left") {
    // Arrow pointing left (for tooltip positioned to the right of target)
    arrowStyles = {
      ...baseStyles,
      left: -size,
      top: offset - size,
      borderWidth: `${size}px ${size}px ${size}px 0`,
      borderColor: `transparent ${arrowColor} transparent transparent`,
    };
  } else if (placement === "right") {
    // Arrow pointing right (for tooltip positioned to the left of target)
    arrowStyles = {
      ...baseStyles,
      right: -size,
      top: offset - size,
      borderWidth: `${size}px 0 ${size}px ${size}px`,
      borderColor: `transparent transparent transparent ${arrowColor}`,
    };
  }

  return <div style={arrowStyles} className="z-10" aria-hidden="true" />;
};

NavigationTourArrow.displayName = "plane-ui-navigation-tour-arrow";
