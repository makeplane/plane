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

import { observer } from "mobx-react";
import { CircleCheck, CircleX } from "lucide-react";

type TProps = {
  failedCount: number;
  successCount: number;
  totalCount: number;
};

export const SuccessFailureIndicator = observer(function SuccessFailureIndicator(props: TProps) {
  const { failedCount, successCount, totalCount } = props;

  if (totalCount === 0) return null;

  const successPercentage = Math.round((successCount / totalCount) * 100);
  const failurePercentage = Math.round((failedCount / totalCount) * 100);

  return (
    <div className="flex flex-shrink-0 items-center gap-2 bg-layer-1/70 px-1.5 py-0.5 rounded-full text-11 font-medium">
      <span className="flex flex-shrink-0 items-center gap-1">
        <div className="grid place-items-center bg-[#1FAD40] size-3 rounded-full">
          <CircleCheck size={8} className="text-on-color" />
        </div>
        <span className="text-tertiary">{successPercentage}%</span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-1">
        <div className="grid place-items-center bg-[#FF0000] size-3 rounded-full">
          <CircleX size={8} className="text-on-color" />
        </div>
        <span className="text-tertiary">{failurePercentage}%</span>
      </span>
    </div>
  );
});
