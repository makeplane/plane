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

import React, { useRef } from "react";

type Props = {
  onClick: () => void;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export const ClickableDiv: React.FC<Props> = (props) => {
  const { onClick, children, ...attributes } = props;
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  return (
    <div
      {...attributes}
      onTouchStart={(event) => {
        // Record touch start position and time
        const touch = event.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
        event.preventDefault();
        event.stopPropagation();
      }}
      onTouchEnd={(event) => {
        // Check if this is a valid tap
        if (!touchStartRef.current) return;

        const touch = event.changedTouches[0];
        const timeDiff = Date.now() - touchStartRef.current.time;
        const distance = Math.sqrt(
          Math.pow(touch.clientX - touchStartRef.current.x, 2) + Math.pow(touch.clientY - touchStartRef.current.y, 2)
        );

        // Valid tap: quick touch (< 500ms) and minimal movement (< 10px)
        if (timeDiff < 500 && distance < 10) {
          event.preventDefault();
          event.stopPropagation();
          onClick();
        }

        // Reset touch state
        touchStartRef.current = null;
      }}
      onTouchMove={(event) => {
        // If user moves finger too much, cancel the tap
        if (!touchStartRef.current) return;

        const touch = event.touches[0];
        const distance = Math.sqrt(
          Math.pow(touch.clientX - touchStartRef.current.x, 2) + Math.pow(touch.clientY - touchStartRef.current.y, 2)
        );

        // If moved more than 10px, cancel the tap
        if (distance > 10) {
          touchStartRef.current = null;
        }
      }}
    >
      {children}
    </div>
  );
};
