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

export function useHasScrollbar<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastValueRef = useRef<boolean>(false);

  const [hasScrollbar, setHasScrollbar] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const nextValue = el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;

    if (lastValueRef.current !== nextValue) {
      lastValueRef.current = nextValue;
      setHasScrollbar(nextValue);
    }
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      measure();
    });
  }, [measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    scheduleMeasure();

    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasure();
    });

    resizeObserver.observe(el);
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [scheduleMeasure]);

  return {
    ref,
    hasScrollbar,
    recheck: scheduleMeasure,
  };
}
