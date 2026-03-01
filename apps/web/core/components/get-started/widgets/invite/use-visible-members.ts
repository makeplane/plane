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

import { useCallback, useEffect, useRef, useState } from "react";
import { CARD_WIDTH, GAP, PADDING } from "./constants";

type UseVisibleMembersParams = {
  readonly totalMembers: number;
};

type UseVisibleMembersResult = {
  readonly containerRef: React.RefObject<HTMLDivElement>;
  readonly visibleCount: number;
};

/**
 * Custom hook to calculate how many member cards can fit in the container
 * and handle responsive resize behavior
 */
export function useVisibleMembers({ totalMembers }: UseVisibleMembersParams): UseVisibleMembersResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(4);

  const calculateVisibleCount = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth - PADDING;
    const maxCards = Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP));
    const fitsAll = totalMembers <= maxCards;

    setVisibleCount(fitsAll ? totalMembers : Math.max(1, maxCards - 1));
  }, [totalMembers]);

  useEffect(() => {
    calculateVisibleCount();

    const resizeObserver = new ResizeObserver(calculateVisibleCount);
    const currentContainer = containerRef.current;

    if (currentContainer) {
      resizeObserver.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
    };
  }, [calculateVisibleCount]);

  return { containerRef, visibleCount };
}
