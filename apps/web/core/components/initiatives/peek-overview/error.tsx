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
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
// assets
import emptyInitiative from "@/app/assets/empty-state/issue.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TInitiativePeekOverviewError = {
  removeRoutePeekId: () => void;
};

export function InitiativePeekOverviewError(props: TInitiativePeekOverviewError) {
  const { removeRoutePeekId } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

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
          image={emptyInitiative ?? undefined}
          title={t("initiatives.empty_state.not_found.title")}
          description={t("initiatives.empty_state.not_found.description")}
        />
      </div>
    </div>
  );
}
