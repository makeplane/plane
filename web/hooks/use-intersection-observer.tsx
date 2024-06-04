import { RefObject, useEffect } from "react";

export type UseIntersectionObserverProps = {
  containerRef: RefObject<HTMLDivElement>;
  elementRef: RefObject<HTMLDivElement>;
  callback: () => void;
  rootMargin?: string;
};

export const useIntersectionObserver = (
  containerRef: RefObject<HTMLDivElement>,
  elementRef: HTMLDivElement | null,
  callback: () => void,
  rootMargin?: string
) => {
  useEffect(() => {
    if (elementRef) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[entries.length - 1].isIntersecting) {
            callback();
          }
        },
        {
          root: containerRef.current,
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
    // while removing the current from the refs, the observer is not not working as expected
    // fix this eslint warning with caution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, callback, elementRef, containerRef.current]);
};
