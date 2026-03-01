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

import React from "react";
// helpers
import { cn } from "@plane/utils";

type Props = {
  children: React.ReactNode;
  elementRef: React.RefObject<HTMLDivElement>;
  isMenuActive?: boolean;
  isActive?: boolean;
};

export function FavoriteItemWrapper(props: Props) {
  const { children, elementRef, isMenuActive = false, isActive = false } = props;
  return (
    <>
      <div
        ref={elementRef}
        className={cn(
          "group/project-item relative w-full p-1 flex items-center rounded-md text-primary hover:bg-layer-transparent-hover",
          {
            "bg-surface-2": isMenuActive,
            "!bg-layer-transparent-active text-primary": isActive,
          }
        )}
      >
        {children}
      </div>
    </>
  );
}
