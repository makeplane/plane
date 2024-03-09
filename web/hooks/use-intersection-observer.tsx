import { RefObject, useState, useEffect } from "react";

export type UseIntersectionObserverProps = {
  containerRef: RefObject<HTMLDivElement>;
  elementRef: RefObject<HTMLDivElement>;
  callback: () => void;
  rootMargin?: string;
};

export const useIntersectionObserver = (props: UseIntersectionObserverProps) => {
  const { containerRef, elementRef, callback, rootMargin = "0px" } = props;
  const [isVisible, setVisibility] = useState(false);

  useEffect(() => {
    if (elementRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            callback();
          }
          setVisibility(entry.isIntersecting);
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

  return isVisible;
};
