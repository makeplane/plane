/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
// plane imports
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
  banner?: ReactNode;
};

export const PageWrapper = (props: TPageWrapperProps) => {
  const { children, header, customHeader, size = "md", banner } = props;

  return (
    <div
      className={cn("mx-auto w-full h-full space-y-6 pt-12 pb-6", {
        "md:px-4 max-w-[1000px] 2xl:max-w-[1200px]": size === "md",
        "px-4": size === "lg",
      })}
    >
      <div>
        {banner && <div className="mx-4 pt-4 shrink-0">{banner}</div>}
        {customHeader ? (
          <div className="border-b border-subtle mx-4 py-4 space-y-1 shrink-0">{customHeader}</div>
        ) : (
          header && (
            <div className="flex items-center justify-between gap-4 border-b border-subtle mx-4 py-4 space-y-1 shrink-0">
              <div className={header.actions ? "flex flex-col gap-1" : "space-y-1"}>
                <div className="text-primary text-h5-semibold">{header.title}</div>
                <div className="text-secondary text-body-sm-regular">{header.description}</div>
              </div>
              {header.actions && <div className="shrink-0">{header.actions}</div>}
            </div>
          )
        )}
      </div>
      <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-sm px-4 pb-4">
        {children}
      </div>
    </div>
  );
};
