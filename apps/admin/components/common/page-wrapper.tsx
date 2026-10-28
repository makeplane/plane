/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useRef, useState } from "react";
// plane imports
import { ScrollArea } from "@makeplane/propel/components/scroll-area";
import { cn } from "@plane/utils";

type TPageWrapperProps = {
  children: ReactNode;
  header?: {
    title: string;
    description: string | ReactNode;
    actions?: ReactNode;
  };
  customHeader?: ReactNode;
  size?: "lg" | "md";
};

export const PageWrapper = (props: TPageWrapperProps) => {
  const { children, header, customHeader, size = "md" } = props;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isViewportFocusVisible, setIsViewportFocusVisible] = useState(false);
  const updateViewportFocusVisible = (target: EventTarget) =>
    setIsViewportFocusVisible(target === viewportRef.current && viewportRef.current.matches(":focus-visible"));

  return (
    <div
      className={cn("mx-auto flex h-full min-h-0 w-full flex-col gap-6 overflow-hidden pt-6 pb-4 md:pt-8", {
        "max-w-[1000px] md:px-4 2xl:max-w-[1200px]": size === "md",
        "px-4": size === "lg",
      })}
    >
      {customHeader ? (
        <div className="mx-4 shrink-0 space-y-1 border-b border-subtle py-4">{customHeader}</div>
      ) : (
        header && (
          <div className="mx-4 flex shrink-0 flex-col items-start justify-between gap-4 border-b border-subtle pb-4 md:flex-row md:items-center">
            <div className="min-w-0 space-y-1">
              <h2 className="text-h5-semibold text-primary">{header.title}</h2>
              <div className="text-body-sm-regular text-secondary">{header.description}</div>
            </div>
            {header.actions && <div className="shrink-0">{header.actions}</div>}
          </div>
        )
      )}
      <div
        className={cn("flex min-h-0 flex-1", {
          "outline-2 -outline-offset-2 outline-accent-strong outline-solid": isViewportFocusVisible,
        })}
        onFocusCapture={(event) => updateViewportFocusVisible(event.target)}
        onKeyDownCapture={(event) => updateViewportFocusVisible(event.target)}
        onPointerDownCapture={(event) => updateViewportFocusVisible(event.target)}
        onBlurCapture={() => setIsViewportFocusVisible(false)}
      >
        <ScrollArea orientation="vertical" variant="inset" size="sm" viewportRef={viewportRef}>
          <div className="px-4 pb-4">{children}</div>
        </ScrollArea>
      </div>
    </div>
  );
};
