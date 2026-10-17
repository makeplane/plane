/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// ui
import { SITES_ISSUE_LAYOUTS } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssueFilter } from "@/hooks/store/use-issue-filter";
// mobx
import type { TIssueLayout } from "@/types/issue";
import { IssueLayoutIcon } from "./layout-icon";

type Props = {
  anchor: string;
};

export const IssuesLayoutSelection = observer(function IssuesLayoutSelection(props: Props) {
  const { anchor } = props;
  // hooks
  const { t } = useTranslation();
  // router
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const labels = searchParams.get("labels");
  const state = searchParams.get("state");
  const priority = searchParams.get("priority");
  const peekId = searchParams.get("peekId");
  // hooks
  const { layoutOptions, getIssueFilters, updateIssueFilters } = useIssueFilter();
  // derived values
  const issueFilters = getIssueFilters(anchor);
  const activeLayout = issueFilters?.display_filters?.layout || undefined;
  const visibleLayouts = SITES_ISSUE_LAYOUTS.filter((layout) => layoutOptions[layout.key]);

  const handleCurrentBoardView = (boardView: TIssueLayout) => {
    if (activeLayout === boardView) return;
    void updateIssueFilters(anchor, "display_filters", "layout", boardView);
    const { queryParam } = queryParamGenerator({ board: boardView, peekId, priority, state, labels });
    router.push(`/issues/${anchor}?${queryParam}`);
  };

  if (visibleLayouts.length === 0 || (visibleLayouts.length === 1 && visibleLayouts[0]?.key === activeLayout))
    return null;

  return (
    <div role="group" aria-label={t("common.layout")} className="flex items-center gap-0.5 rounded-lg bg-layer-3 p-0.5">
      {visibleLayouts.map((layout) => (
        <IconButton
          key={layout.key}
          size="sm"
          variant={activeLayout === layout.key ? "secondary" : "ghost"}
          aria-label={t(layout.titleTranslationKey)}
          aria-pressed={activeLayout === layout.key}
          icon={<Icon icon={<IssueLayoutIcon layout={layout.key} />} />}
          onClick={() => handleCurrentBoardView(layout.key)}
        />
      ))}
    </div>
  );
});
