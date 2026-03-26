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
import { TimelineItemIcon } from "../timeline/timeline-item-icon";

export type CollapsedGroupProps = {
  icons: ReactNode[];
  count: number;
  onExpand: () => void;
};

export function CollapsedGroup(props: CollapsedGroupProps) {
  const { icons, count, onExpand } = props;

  return (
    <div className="flex w-full items-center gap-3 pb-6">
      {/* Stacked overlapping icons */}
      <div className="flex items-center pr-5">
        {icons.slice(0, 3).map((icon, index) => (
          <div key={index} className={index < icons.length - 1 ? "mr-[-20px]" : ""}>
            <TimelineItemIcon>{icon}</TimelineItemIcon>
          </div>
        ))}
      </div>

      {/* Button */}
      <div className="flex shrink-0 items-center justify-center">
        <button
          type="button"
          className="h-6 px-2 text-body-xs-medium text-secondary shrink-0"
          onClick={onExpand}
          aria-label={`See ${count} activities`}
        >
          See {count} activities
        </button>
      </div>
    </div>
  );
}
