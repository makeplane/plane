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

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { TourPulseIndicatorProps } from "./tour-types";

const OUTER_SIZE = 24; // Outer circle size
const INNER_SIZE = 12; // Inner circle size
const OFFSET = -2; // Offset from bottom of target element

/**
 * TourPulseIndicator - Animated pulse indicator for tour target elements
 *
 * Displays a pulsing animation at the bottom-center of the target element
 * to draw user attention during the tour.
 *
 * @param targetElement - CSS selector for target element
 * @param isActive - Whether the indicator should be visible
 */
export const TourPulseIndicator: React.FC<TourPulseIndicatorProps> = ({ targetElement, isActive }) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isActive || !targetElement) {
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(targetElement) as HTMLElement;
      if (!element) {
        setPosition(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      // Position indicator at the bottom center of the target element
      setPosition({
        top: rect.bottom + OFFSET,
        left: rect.left + rect.width / 2 - OUTER_SIZE / 2,
      });
    };

    updatePosition();

    // Update position on window resize or scroll
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [targetElement, isActive]);

  if (typeof document === "undefined" || !position || !isActive) return null;

  return createPortal(
    <AnimatePresence>
      {isActive && (
        <div
          className="fixed pointer-events-none z-[9998]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${OUTER_SIZE}px`,
            height: `${OUTER_SIZE}px`,
          }}
        >
          {/* Outer circle - scales and fades */}
          <motion.div
            className="absolute inset-0 rounded-full bg-accent-primary/50"
            initial={{ scale: 1, opacity: 1 }}
            animate={{
              scale: [1, 1, 1],
              opacity: [1, 0.6, 0.25],
            }}
            exit={{ scale: 0.25, opacity: 0.1 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inner circle - pulsing opacity */}
          <motion.div
            className="absolute rounded-full bg-accent-primary"
            style={{
              width: `${INNER_SIZE}px`,
              height: `${INNER_SIZE}px`,
              left: `${(OUTER_SIZE - INNER_SIZE) / 2}px`,
              top: `${(OUTER_SIZE - INNER_SIZE) / 2}px`,
            }}
            initial={{ opacity: 0.6 }}
            animate={{
              opacity: [0.75, 1, 0.75],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

TourPulseIndicator.displayName = "plane-ui-tour-pulse-indicator";
