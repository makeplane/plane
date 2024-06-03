import { RefObject, useEffect } from "react";

export type UseIntersectionObserverProps = {
  containerRef: RefObject<HTMLDivElement>;
  elementRef: RefObject<HTMLDivElement>;
  callback: () => void;
  rootMargin?: string;
};

export const useIntersectionObserver = (
  containerRef: RefObject<HTMLDivElement>,
  elementRef: RefObject<HTMLDivElement>,
  callback: () => void,
  rootMargin?: string
) => {
  useEffect(() => {
    if (elementRef.current) {
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
      observer.observe(elementRef.current);
      return () => {
        if (elementRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          observer.unobserve(elementRef.current);
        }
      };
    }
    // while removing the current from the refs, the observer is not not working as expected
    // fix this eslint warning with caution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootMargin, callback, elementRef.current, containerRef.current]);
};
