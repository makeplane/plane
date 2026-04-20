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
import { useEffect, useRef } from "react";

type TIntersectionObserverRoot = RefObject<HTMLElement | null> | HTMLElement | null | undefined;

const resolveIntersectionObserverRoot = (containerRef: TIntersectionObserverRoot) =>
  containerRef && "current" in containerRef ? containerRef.current : containerRef;

export type UseIntersectionObserverProps = {
  containerRef: TIntersectionObserverRoot;
  elementRef: HTMLElement | null;
  callback: () => void;
  rootMargin?: string;
};

export const useIntersectionObserver = (
  containerRef: TIntersectionObserverRoot,
  elementRef: HTMLElement | null,
  callback: (() => void) | undefined,
  rootMargin?: string
) => {
  const callbackRef = useRef(callback);
  const root = resolveIntersectionObserverRoot(containerRef);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[entries.length - 1]?.isIntersecting) {
          callbackRef.current?.();
        }
      },
      {
        root,
        rootMargin,
      }
    );

    observer.observe(elementRef);

    return () => {
      observer.unobserve(elementRef);
    };
  }, [elementRef, root, rootMargin]);
};
