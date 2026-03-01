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

export const useUploadStatus = (uploadStatus: number) => {
  // Displayed status that will animate smoothly
  const [displayStatus, setDisplayStatus] = useState(0);
  // Animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const animateToValue = (start: number, end: number, startTime: number) => {
      const duration = 200;

      const animation = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);

        // Calculate current display value
        const currentValue = Math.floor(start + (end - start) * easeOutCubic);
        setDisplayStatus(currentValue);

        // Continue animation if not complete
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame((time) => animation(time));
        }
      };
      animationFrameRef.current = requestAnimationFrame((time) => animation(time));
    };
    animateToValue(displayStatus, uploadStatus == undefined ? 100 : uploadStatus, performance.now());

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [displayStatus, uploadStatus]);

  if (uploadStatus === undefined) return null;

  return displayStatus;
};
