/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { Collapsible } from "@base-ui/react/collapsible";
import { observer } from "mobx-react";
// components
import { useTranslation } from "@plane/i18n";
import { ContentWrapper, ERowVariant } from "@plane/blocks/layout";
import { ListLayout } from "@/components/core/list";
// local imports
import { CyclePeekOverview } from "../cycle-peek-overview";
import { CycleListGroupHeader } from "./cycle-list-group-header";
import { CyclesListMap } from "./cycles-list-map";
import { ActiveCycleRoot } from "../active-cycle/root";

export interface ICyclesList {
  completedCycleIds: string[];
  upcomingCycleIds?: string[] | undefined;
  cycleIds: string[];
  workspaceSlug: string;
  projectId: string;
  isArchived?: boolean;
}

export const CyclesList = observer(function CyclesList(props: ICyclesList) {
  const { completedCycleIds, upcomingCycleIds, cycleIds, workspaceSlug, projectId, isArchived = false } = props;
  const { t } = useTranslation();
  // states
  const [isUpcomingExpanded, setIsUpcomingExpanded] = useState(true);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  return (
    <ContentWrapper variant={ERowVariant.HUGGING} className="flex-row">
      <ListLayout>
        {isArchived ? (
          <>
            <CyclesListMap cycleIds={cycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
          </>
        ) : (
          <>
            <ActiveCycleRoot workspaceSlug={workspaceSlug} projectId={projectId} />

            {upcomingCycleIds && (
              <Collapsible.Root
                open={isUpcomingExpanded}
                onOpenChange={setIsUpcomingExpanded}
                className="flex flex-shrink-0 flex-col"
              >
                <Collapsible.Trigger className="sticky top-0 z-[2] w-full flex-shrink-0 cursor-pointer border-b border-subtle bg-layer-1">
                  <CycleListGroupHeader
                    title={t("project_cycles.upcoming_cycle.label")}
                    type="upcoming"
                    count={upcomingCycleIds.length}
                    showCount
                    isExpanded={isUpcomingExpanded}
                  />
                </Collapsible.Trigger>
                <Collapsible.Panel>
                  <CyclesListMap cycleIds={upcomingCycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
                </Collapsible.Panel>
              </Collapsible.Root>
            )}
            <Collapsible.Root
              open={isCompletedExpanded}
              onOpenChange={setIsCompletedExpanded}
              className="flex flex-shrink-0 flex-col pb-7"
            >
              <Collapsible.Trigger className="sticky top-0 z-2 w-full flex-shrink-0 cursor-pointer border-b border-subtle bg-layer-1">
                <CycleListGroupHeader
                  title={t("project_cycles.completed_cycle.label")}
                  type="completed"
                  count={completedCycleIds.length}
                  showCount
                  isExpanded={isCompletedExpanded}
                />
              </Collapsible.Trigger>
              <Collapsible.Panel>
                <CyclesListMap cycleIds={completedCycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
              </Collapsible.Panel>
            </Collapsible.Root>
          </>
        )}
      </ListLayout>
      <CyclePeekOverview projectId={projectId} workspaceSlug={workspaceSlug} isArchived={isArchived} />
    </ContentWrapper>
  );
});
