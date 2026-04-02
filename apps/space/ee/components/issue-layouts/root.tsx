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
import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { E_FEATURE_FLAGS } from "@plane/constants";
// components
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useStates } from "@/hooks/store/use-state";
import { useFeatureFlags } from "@/plane-web/hooks/store/use-feature-flags";
import { useView } from "@/plane-web/hooks/store/use-published-view";
// store
import type { PublishStore } from "@/store/publish/publish.store";
//
import { BaseCalendarRoot } from "./calendar/base-calendar-root";
import { ViewAppliedFilters } from "./filters/applied-filters/root";
import { BaseGanttRoot } from "./gantt";
import { BaseKanBanRoot } from "./kanban/base-kanban-root";
import { BaseListRoot } from "./list/base-list-root";
import { BaseSpreadsheetRoot } from "./spreadsheet/base-spreadsheet-root";

type Props = {
  peekId: string | undefined;
  publishSettings: PublishStore;
};

export const ViewLayoutsRoot = observer(function ViewLayoutsRoot(props: Props) {
  const { peekId, publishSettings } = props;
  // router
  const router = useRouter();
  // store
  const issueDetailStore = useIssueDetails();
  const { viewData } = useView();
  const { fetchStates } = useStates();
  const { fetchLabels } = useLabel();
  const { fetchCycles } = useCycle();
  const { fetchModules } = useModule();
  const { fetchMembers } = useMember();
  const { fetchFeatureFlags } = useFeatureFlags();

  const { anchor } = publishSettings;

  useSWR(anchor ? `PUBLIC_STATES_${anchor}` : null, anchor ? () => fetchStates(anchor) : null);
  useSWR(anchor ? `PUBLIC_LABELS_${anchor}` : null, anchor ? () => fetchLabels(anchor) : null);
  useSWR(anchor ? `PUBLIC_CYCLES_${anchor}` : null, anchor ? () => fetchCycles(anchor) : null);
  useSWR(anchor ? `PUBLIC_MODULES_${anchor}` : null, anchor ? () => fetchModules(anchor) : null);
  useSWR(anchor ? `PUBLIC_MEMBERS_${anchor}` : null, anchor ? () => fetchMembers(anchor) : null);
  useSWR(
    anchor ? `PUBLIC_FEATURE_FLAGS_${anchor}` : null,
    anchor
      ? () =>
          fetchFeatureFlags(anchor, [E_FEATURE_FLAGS.MILESTONES, E_FEATURE_FLAGS.ISSUE_TYPES, E_FEATURE_FLAGS.EPICS])
      : null
  );

  // derived values
  const activeLayout = viewData?.display_filters?.layout ?? "kanban";

  useEffect(() => {
    if (peekId) {
      issueDetailStore.setPeekId(peekId.toString());
    }
  }, [peekId, issueDetailStore]);

  const handlePeekClose = () => {
    issueDetailStore.setPeekId(null);
    router.push(`/views/${anchor}`);
  };

  if (!anchor) return null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {peekId && <IssuePeekOverview anchor={anchor} peekId={peekId} handlePeekClose={handlePeekClose} />}

      <>
        {activeLayout && (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {/* applied filters */}
            <ViewAppliedFilters anchor={anchor} />

            {activeLayout === "list" && (
              <div className="relative h-full w-full overflow-y-auto">
                <BaseListRoot anchor={anchor} />
              </div>
            )}
            {activeLayout === "kanban" && (
              <div className="relative mx-auto h-full w-full">
                <BaseKanBanRoot anchor={anchor} />
              </div>
            )}
            {activeLayout === "spreadsheet" && (
              <div className="relative mx-auto h-full w-full">
                <BaseSpreadsheetRoot anchor={anchor} />
              </div>
            )}
            {activeLayout === "calendar" && (
              <div className="relative mx-auto h-full w-full">
                <BaseCalendarRoot anchor={anchor} />
              </div>
            )}
            {activeLayout === "gantt_chart" && (
              <div className="relative mx-auto h-full w-full">
                <BaseGanttRoot anchor={anchor} />
              </div>
            )}
          </div>
        )}
      </>
    </div>
  );
});
