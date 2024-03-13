import { RefObject, useState, useEffect } from "react";

export type UseIntersectionObserverProps = {
  containerRef: RefObject<HTMLDivElement | null> | undefined;
  elementRef: RefObject<HTMLDivElement>;
  callback: () => void;
  rootMargin?: string;
};

export const useIntersectionObserver = (
  containerRef: RefObject<HTMLDivElement | null> | undefined,
  elementRef: RefObject<HTMLElement | null>,
  callback: (() => void) | undefined,
  rootMargin?: string
) => {
  useEffect(() => {
    if (elementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            callback && callback();
          }
        },
        {
          root: containerRef?.current,
          rootMargin,
        }
      );
      observer.observe(elementRef.current);
      return () => {
        if (elementRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          observer.unobserve(elementRef.current);
        }
      };
    }
    // When i am passing callback as a dependency, it is causing infinite loop,
    // Please make sure you fix this eslint lint disable error with caution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementRef, containerRef, rootMargin, callback]);
};
