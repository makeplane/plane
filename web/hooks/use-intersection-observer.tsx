import { RefObject, useEffect } from "react";

export const useIntersectionObserver = (
  containerRef: RefObject<HTMLDivElement>,
  elementRef: RefObject<HTMLDivElement>,
  callback: () => void,
  rootMargin = "20%"
) => {
  useEffect(() => {
    if (elementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            callback();
          }
        },
        {
          root: null,
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
  }, [elementRef, containerRef, rootMargin, callback]);
};
