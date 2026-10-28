/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
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

  return (
    <div
      className={cn("mx-auto flex h-full min-h-0 w-full flex-col gap-6 overflow-hidden py-4", {
        "max-w-[1000px] md:px-4 2xl:max-w-[1200px]": size === "md",
        "px-4 lg:px-12": size === "lg",
      })}
    >
      {customHeader ? (
        <div className="mx-4 shrink-0 space-y-1 border-b border-subtle py-4">{customHeader}</div>
      ) : (
        header && (
          <div className="mx-4 flex shrink-0 items-center justify-between gap-4 space-y-1 border-b border-subtle py-4">
            <div className={header.actions ? "flex flex-col gap-1" : "space-y-1"}>
              <div className="text-h5-semibold text-primary">{header.title}</div>
              <div className="text-body-sm-regular text-secondary">{header.description}</div>
            </div>
            {header.actions && <div className="shrink-0">{header.actions}</div>}
          </div>
        )
      )}
      <ScrollArea orientation="vertical" variant="inset" size="sm">
        <div className="px-4 pb-4">{children}</div>
      </ScrollArea>
    </div>
  );
};
