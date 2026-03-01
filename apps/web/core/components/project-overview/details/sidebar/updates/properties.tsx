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

import { Rocket } from "lucide-react";
import { cn } from "@plane/utils";

type TProps = {
  isCollapsed: boolean;
};
export function Properties(props: TProps) {
  const { isCollapsed } = props;
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out ",
        !isCollapsed ? "max-h-[800px] border-t border-subtle" : "max-h-0"
      )}
    >
      <div className="my-4">
        {/* Properties */}
        <div>
          <div className="flex">
            <div className="text-11 font-medium text-tertiary w-3/6 my-auto">State</div>
            <div className="flex items-center gap-2 truncate max-w-[100px] flex-1 text-tertiary my-auto">
              <div className="flex-grow truncate">..</div>
            </div>
          </div>

          <div className="flex">
            <div className="text-11 font-medium text-tertiary w-3/6 my-auto">Priority</div>
            <div className="flex items-center gap-2 truncate max-w-[100px] flex-1 text-tertiary my-auto">
              <div className="flex-grow truncate">..</div>
            </div>
          </div>

          <div className="flex">
            <div className="text-11 font-medium text-tertiary w-3/6 my-auto">{"Start -> End date"}</div>
            <div className="flex items-center gap-2 truncate max-w-[100px] flex-1 text-tertiary my-auto">
              <div className="flex-grow truncate">..</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
