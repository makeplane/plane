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

import type { FC } from "react";
import { MoveRight } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// assets
import emptyIssue from "@/app/assets/empty-state/issue.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TEpicPeekOverviewError = {
  removeRoutePeekId: () => void;
};

export function EpicPeekOverviewError(props: TEpicPeekOverviewError) {
  const { removeRoutePeekId } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col">
      <div className="flex-shrink-0 flex justify-start">
        <Tooltip tooltipContent="Close the peek view" isMobile={isMobile}>
          <button onClick={removeRoutePeekId} className="w-5 h-5 m-5">
            <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary" />
          </button>
        </Tooltip>
      </div>

      <div className="w-full h-full">
        <EmptyState
          image={emptyIssue ?? undefined}
          title="Epic does not exist"
          description="The epic you are looking for does not exist, has been archived, or has been deleted."
        />
      </div>
    </div>
  );
}
