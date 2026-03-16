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

import type { TCycleProgress } from "@plane/types";
import { CircularProgressIndicator } from "@plane/ui";

type Props = {
  progress: Partial<TCycleProgress> | null | undefined;
};

function ProgressDonut(props: Props) {
  const { progress } = props;
  const percentage = progress ? ((progress?.completed ?? 0) * 100) / (progress?.scope || 1) : 0;

  return (
    <div className="flex items-center justify-between rounded-full shrink-0">
      <CircularProgressIndicator size={48} percentage={percentage} strokeWidth={3}>
        <span className="text-xs text-primary font-medium block text-center">
          {`${percentage ? percentage.toFixed(0) : 0}%`}
        </span>
      </CircularProgressIndicator>
    </div>
  );
}

export default ProgressDonut;
