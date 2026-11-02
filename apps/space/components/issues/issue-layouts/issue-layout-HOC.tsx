/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { useTranslation } from "@plane/i18n";
import type { TLoader } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";

interface Props {
  children: string | React.ReactNode | React.ReactNode[];
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getIssueLoader: (groupId?: string, subGroupId?: string) => TLoader;
}

export const IssueLayoutHOC = observer(function IssueLayoutHOC(props: Props) {
  const { getIssueLoader, getGroupIssueCount } = props;
  // i18n
  const { t } = useTranslation();

  const issueCount = getGroupIssueCount(undefined, undefined, false);

  if (getIssueLoader() === "init-loader" || issueCount === undefined) {
    return (
      <div className="relative grid size-full place-items-center">
        <LogoSpinner />
      </div>
    );
  }

  if (getGroupIssueCount(undefined, undefined, false) === 0) {
    return <EmptyStateCompact assetKey="work-item" title={t("project_empty_state.work_item_filter.title")} />;
  }

  return <>{props.children}</>;
});
