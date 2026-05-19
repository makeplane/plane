/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode, MutableRefObject } from "react";
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@plane/utils";
import { runIdleTask } from "@/lib/idle-task";

type Props = {
  defaultHeight?: string;
  verticalOffset?: number;
  horizontalOffset?: number;
  root?: MutableRefObject<HTMLElement | null>;
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  classNames?: string;
  placeholderChildren?: ReactNode;
  defaultValue?: boolean;
  shouldRecordHeights?: boolean;
  useIdleTime?: boolean;
  forceRender?: boolean;
};

function RenderIfVisible(props: Props) {
  const {
    defaultHeight = "300px",
    root,
    verticalOffset = 50,
    horizontalOffset = 0,
    as = "div",
    children,
    classNames = "",
    shouldRecordHeights = true,
    //placeholder children
    placeholderChildren = null, //placeholder children
    defaultValue = false,
    useIdleTime = false,
    forceRender = false,
  } = props;
  const [shouldVisible, setShouldVisible] = useState<boolean>(defaultValue);
  const placeholderHeight = useRef<string>(defaultHeight);
  const intersectionRef = useRef<HTMLElement | null>(null);
  const visibilityIdleTaskRef = useRef<ReturnType<typeof runIdleTask> | null>(null);
  const heightIdleTaskRef = useRef<ReturnType<typeof runIdleTask> | null>(null);

  const isVisible = shouldVisible || forceRender;

  // Set visibility with intersection observer
  useEffect(() => {
    const target = intersectionRef.current;
    if (target) {
      const observer = new IntersectionObserver(
        (entries) => {
          //DO no remove comments for future
          if (typeof window !== "undefined" && useIdleTime) {
            visibilityIdleTaskRef.current?.cancel();
            visibilityIdleTaskRef.current = runIdleTask(() =>
              setShouldVisible(entries[entries.length - 1].isIntersecting)
            );
          } else {
            setShouldVisible(entries[entries.length - 1].isIntersecting);
          }
        },
        {
          root: root?.current,
          rootMargin: `${verticalOffset}% ${horizontalOffset}% ${verticalOffset}% ${horizontalOffset}%`,
        }
      );
      observer.observe(target);
      return () => {
        visibilityIdleTaskRef.current?.cancel();
        visibilityIdleTaskRef.current = null;
        observer.unobserve(target);
      };
    }
  }, [intersectionRef, root, verticalOffset, horizontalOffset, useIdleTime]);

  //Set height after render
  useEffect(() => {
    if (intersectionRef.current && isVisible && shouldRecordHeights) {
      heightIdleTaskRef.current?.cancel();
      heightIdleTaskRef.current = runIdleTask(() => {
        if (intersectionRef.current) placeholderHeight.current = `${intersectionRef.current.offsetHeight}px`;
      });
    }
    return () => {
      heightIdleTaskRef.current?.cancel();
      heightIdleTaskRef.current = null;
    };
  }, [isVisible, intersectionRef, shouldRecordHeights]);

  const child = isVisible ? <>{children}</> : placeholderChildren;
  const style = isVisible || !shouldRecordHeights ? {} : { height: placeholderHeight.current, width: "100%" };
  const className = isVisible || placeholderChildren ? classNames : cn(classNames, "bg-layer-1");

  return React.createElement(as, { ref: intersectionRef, style, className }, child);
}

export default RenderIfVisible;
