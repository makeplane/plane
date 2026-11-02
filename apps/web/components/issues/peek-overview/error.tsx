/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ArrowNarrowRightOutline } from "@makeplane/propel/icons";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
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
  const { t } = useTranslation();
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      <div className="flex flex-shrink-0 justify-start">
        <div className="m-5">
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t("common.close_peek_view")}
            showTooltip={!isMobile}
            onClick={removeRoutePeekId}
            icon={<Icon icon={ArrowNarrowRightOutline} />}
          />
        </div>
      </div>

      <div className="h-full w-full">
        <EmptyState
          image={emptyIssue ?? undefined}
          title="Work item does not exist"
          description="The work item you are looking for does not exist, has been archived, or has been deleted."
        />
      </div>
    </div>
  );
}
