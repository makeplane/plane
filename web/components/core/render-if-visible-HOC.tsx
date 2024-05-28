import React, { useState, useRef, useEffect, ReactNode, MutableRefObject } from "react";
import { cn } from "@/helpers/common.helper";

type Props = {
  defaultHeight?: string;
  verticalOffset?: number;
  horizontalOffset?: number;
  root?: MutableRefObject<HTMLElement | null>;
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  classNames?: string;
  alwaysRender?: boolean;
  placeholderChildren?: ReactNode;
  pauseHeightUpdateWhileRendering?: boolean;
};

const RenderIfVisible: React.FC<Props> = (props) => {
  const {
    defaultHeight = "300px",
    root,
    verticalOffset = 50,
    horizontalOffset = 0,
    as = "div",
    children,
    classNames = "",
    alwaysRender = false, //render the children even if it is not visible in root
    placeholderChildren = null, //placeholder children
    pauseHeightUpdateWhileRendering = false, //while this is true the height of the blocks are maintained
  } = props;
  const [shouldVisible, setShouldVisible] = useState<boolean>(alwaysRender);
  const placeholderHeight = useRef<string>(defaultHeight);
  const intersectionRef = useRef<HTMLElement | null>(null);

  const isVisible = alwaysRender || shouldVisible;

  // Set visibility with intersection observer
  useEffect(() => {
    if (intersectionRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          //DO no remove comments for future
          // if (typeof window !== undefined && window.requestIdleCallback) {
          //   window.requestIdleCallback(() => setShouldVisible(entries[0].isIntersecting), {
          //     timeout: 300,
          //   });
          // } else {
          //   setShouldVisible(entries[0].isIntersecting);
          // }
          setShouldVisible(entries[entries.length - 1].isIntersecting);
        },
        {
          root: root?.current,
          rootMargin: `${verticalOffset}% ${horizontalOffset}% ${verticalOffset}% ${horizontalOffset}%`,
        }
      );
      observer.observe(intersectionRef.current);
      return () => {
        if (intersectionRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          observer.unobserve(intersectionRef.current);
        }
      };
    }
  }, [intersectionRef, children, root, verticalOffset, horizontalOffset]);

  //Set height after render
  useEffect(() => {
    if (intersectionRef.current && isVisible) {
      placeholderHeight.current = `${intersectionRef.current.offsetHeight}px`;
    }
  }, [isVisible, intersectionRef, alwaysRender, pauseHeightUpdateWhileRendering]);

  const child = isVisible ? <>{children}</> : placeholderChildren;
  const style =
    isVisible && !pauseHeightUpdateWhileRendering ? {} : { height: placeholderHeight.current, width: "100%" };
  const className = isVisible ? classNames : cn(classNames, "bg-custom-background-80");

  return React.createElement(as, { ref: intersectionRef, style, className }, child);
};

export default RenderIfVisible;
