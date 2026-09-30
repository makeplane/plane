/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { MoveRight } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
// assets
import emptyIssue from "@/app/assets/empty-state/issue.svg?url";
// components
import { EmptyState } from "@/components/common/empty-state";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssuePeekOverviewError = {
  removeRoutePeekId: () => void;
};

export function IssuePeekOverviewError(props: TIssuePeekOverviewError) {
  const { removeRoutePeekId } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 justify-start">
        <Tooltip tooltipContent={t("issue_ui.close_peek")} isMobile={isMobile}>
          <button onClick={removeRoutePeekId} className="m-5 h-5 w-5">
            <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary" />
          </button>
        </Tooltip>
      </div>

      <div className="h-full w-full">
        <EmptyState
          image={emptyIssue ?? undefined}
          title={t("issue.empty_state.issue_detail.title")}
          description={t("issue.empty_state.issue_detail.description")}
        />
      </div>
    </div>
  );
}
