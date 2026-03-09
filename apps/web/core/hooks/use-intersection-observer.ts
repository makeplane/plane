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

import type { RefObject } from "react";
import { useEffect } from "react";

export type UseIntersectionObserverProps = {
  containerRef: RefObject<HTMLDivElement | null> | undefined;
  elementRef: HTMLElement | null;
  callback: () => void;
  rootMargin?: string;
};

export const useIntersectionObserver = (
  containerRef: RefObject<HTMLDivElement | null>,
  elementRef: HTMLElement | null,
  callback: (() => void) | undefined,
  rootMargin?: string
) => {
  useEffect(() => {
    if (elementRef) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[entries.length - 1].isIntersecting) {
            callback && callback();
          }
        },
        {
          root: containerRef?.current,
          rootMargin,
        }
      );
      observer.observe(elementRef);
      return () => {
        if (elementRef) {
          observer.unobserve(elementRef);
        }
      };
    }
    // When i am passing callback as a dependency, it is causing infinite loop,
    // Please make sure you fix this eslint lint disable error with caution
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, callback, elementRef, containerRef.current]);
};
