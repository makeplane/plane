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

import { useState } from "react";
import type { TCycleProgress } from "@plane/types";
import { CircularProgressIndicator } from "@plane/ui";

type Props = {
  progress: Partial<TCycleProgress> | null | undefined;
  days_left: number;
};

function ProgressDonut(props: Props) {
  const { progress, days_left } = props;
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const percentage = progress ? ((progress?.completed ?? 0) * 100) / (progress?.scope ?? 1) : 0;

  return (
    <div
      className="group flex items-center justify-between py-1 rounded-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CircularProgressIndicator size={65} percentage={percentage} strokeWidth={3}>
        <span className="text-[20px] text-accent-secondary font-bold block text-center">
          {progress ? (isHovering ? days_left : `${percentage ? percentage.toFixed(0) : 0}%`) : "0%"}
        </span>

        {isHovering && (
          <div className="text-accent-secondary text-9 uppercase whitespace-nowrap tracking-[0.9px] font-semibold leading-[11px] text-center">
            {days_left === 1 ? "Day" : "Days"} <br /> left
          </div>
        )}
      </CircularProgressIndicator>
    </div>
  );
}

export default ProgressDonut;
