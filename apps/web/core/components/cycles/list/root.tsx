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

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { observer } from "mobx-react";
import { useState } from "react";
// components
import { ListLayout } from "@/components/core/list";
import { ProjectActiveCycleRoot } from "@/components/cycles/active-cycles/root";
import { useTranslation } from "@plane/i18n";
import { ContentWrapper, ERowVariant } from "@plane/ui";
// local imports
import { CyclePeekOverview } from "../cycle-peek-overview";
import { CycleListGroupHeader } from "./cycle-list-group-header";
import { CyclesListMap } from "./cycles-list-map";

export interface ICyclesList {
  activeCycleIds?: string[];
  completedCycleIds: string[];
  upcomingCycleIds?: string[] | undefined;
  cycleIds: string[];
  workspaceSlug: string;
  projectId: string;
  isArchived?: boolean;
}

const UpcomingCyclesCollapsible = observer(function UpcomingCyclesCollapsible({
  upcomingCycleIds,
  projectId,
  workspaceSlug,
  isOpen,
  onOpenChange,
}: {
  upcomingCycleIds: string[];
  projectId: string;
  workspaceSlug: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Collapsible className="flex flex-shrink-0 flex-col" open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-subtle bg-layer-1 cursor-pointer">
        <CycleListGroupHeader
          title={t("project_cycles.upcoming_cycle.label")}
          type="upcoming"
          count={upcomingCycleIds.length}
          showCount
          isExpanded={isOpen}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CyclesListMap cycleIds={upcomingCycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
      </CollapsibleContent>
    </Collapsible>
  );
});

const CompletedCyclesCollapsible = observer(function CompletedCyclesCollapsible({
  completedCycleIds,
  projectId,
  workspaceSlug,
  isOpen,
  onOpenChange,
}: {
  completedCycleIds: string[];
  projectId: string;
  workspaceSlug: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Collapsible className="flex flex-shrink-0 flex-col pb-7" open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="sticky top-0 z-2 w-full flex-shrink-0 border-b border-subtle bg-layer-1 cursor-pointer">
        <CycleListGroupHeader
          title={t("project_cycles.completed_cycle.label")}
          type="completed"
          count={completedCycleIds.length}
          showCount
          isExpanded={isOpen}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CyclesListMap cycleIds={completedCycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
      </CollapsibleContent>
    </Collapsible>
  );
});

export const CyclesList = observer(function CyclesList(props: ICyclesList) {
  const {
    activeCycleIds,
    completedCycleIds,
    upcomingCycleIds,
    cycleIds,
    workspaceSlug,
    projectId,
    isArchived = false,
  } = props;
  // Lift collapsible state here so it persists across child remounts
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);

  return (
    <ContentWrapper variant={ERowVariant.HUGGING} className="flex-row">
      <ListLayout>
        {isArchived ? (
          <>
            <CyclesListMap cycleIds={cycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
          </>
        ) : (
          <>
            {activeCycleIds && activeCycleIds.length > 0 && (
              <ProjectActiveCycleRoot workspaceSlug={workspaceSlug} projectId={projectId} cycleIds={activeCycleIds} />
            )}
            {upcomingCycleIds && (
              <UpcomingCyclesCollapsible
                upcomingCycleIds={upcomingCycleIds}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                isOpen={isUpcomingOpen}
                onOpenChange={setIsUpcomingOpen}
              />
            )}
            <CompletedCyclesCollapsible
              completedCycleIds={completedCycleIds}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              isOpen={isCompletedOpen}
              onOpenChange={setIsCompletedOpen}
            />
          </>
        )}
      </ListLayout>
      <CyclePeekOverview projectId={projectId} workspaceSlug={workspaceSlug} isArchived={isArchived} />
    </ContentWrapper>
  );
});
