import { RefObject, useEffect } from "react";

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
          // eslint-disable-next-line react-hooks/exhaustive-deps
          observer.unobserve(elementRef);
        }
      };
    }
    // When i am passing callback as a dependency, it is causing infinite loop,
    // Please make sure you fix this eslint lint disable error with caution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, callback, elementRef, containerRef.current]);
};
