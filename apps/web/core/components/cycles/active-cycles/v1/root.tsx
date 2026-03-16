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

import { useState } from "react";
import { observer } from "mobx-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import type { ICycle } from "@plane/types";
import { Row } from "@plane/ui";
// components
import { CycleListGroupHeader } from "@/components/cycles/list/cycle-list-group-header";
import { CyclesListItem } from "@/components/cycles/list/cycles-list-item";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
// store
import type { ActiveCycleIssueDetails } from "@/store/work-items/cycle/issue.store";
// local imports
import { ActiveCycleStats } from "./cycle-stats";
import { ActiveCycleProductivity } from "./productivity";
import { ActiveCycleProgress } from "./progress";
import { useActiveCycleDetails } from "./use-active-cycle-details";

type ActiveCycleRootProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string | undefined;
  cycleIds?: string[];
  showHeader?: boolean;
};

type ActiveCyclesComponentProps = {
  cycleId: string | null | undefined;
  activeCycle: ICycle | null;
  workspaceSlug: string;
  projectId: string;
  handleFiltersUpdate: (filters: any) => void;
  cycleIssueDetails?: ActiveCycleIssueDetails | { nextPageResults: boolean };
};

const ActiveCyclesComponent = observer(function ActiveCyclesComponent({
  cycleId,
  activeCycle,
  workspaceSlug,
  projectId,
  handleFiltersUpdate,
  cycleIssueDetails,
}: ActiveCyclesComponentProps) {
  const { t } = useTranslation();

  if (!cycleId || !activeCycle) {
    return (
      <EmptyStateDetailed
        assetKey="cycle"
        title={t("project_cycles.empty_state.active.title")}
        description={t("project_cycles.empty_state.active.description")}
        rootClassName="py-10 h-auto"
      />
    );
  }

  return (
    <div className="flex flex-col border-b border-subtle">
      <CyclesListItem
        key={cycleId}
        cycleId={cycleId}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        className="!border-b-transparent"
      />
      <Row className="bg-surface-1 pt-3 pb-6">
        <div className="grid grid-cols-1 bg-surface-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <ActiveCycleProgress
            handleFiltersUpdate={handleFiltersUpdate}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            cycle={activeCycle}
          />
          <ActiveCycleProductivity workspaceSlug={workspaceSlug} projectId={projectId} cycle={activeCycle} />
          <ActiveCycleStats
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            cycle={activeCycle}
            cycleId={cycleId}
            handleFiltersUpdate={handleFiltersUpdate}
            cycleIssueDetails={cycleIssueDetails}
          />
        </div>
      </Row>
    </div>
  );
});

// Renders details for a single cycle ID — calls the data-fetching hook internally
const ActiveCycleEntry = observer(function ActiveCycleEntry({
  cycleId,
  workspaceSlug,
  projectId,
}: {
  cycleId: string;
  workspaceSlug: string;
  projectId: string;
}) {
  const {
    handleFiltersUpdate,
    cycle: activeCycle,
    cycleIssueDetails,
  } = useActiveCycleDetails({
    workspaceSlug,
    projectId,
    cycleId,
  });

  return (
    <ActiveCyclesComponent
      cycleId={cycleId}
      activeCycle={activeCycle}
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      handleFiltersUpdate={handleFiltersUpdate}
      cycleIssueDetails={cycleIssueDetails}
    />
  );
});

export const ActiveCycleRoot = observer(function ActiveCycleRoot(props: ActiveCycleRootProps) {
  const { workspaceSlug, projectId, cycleId: propsCycleId, cycleIds: propsCycleIds, showHeader = true } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getActiveCycleIds, currentProjectActiveCycleId } = useCycle();
  const activeCyclesForProject = getActiveCycleIds(projectId);

  // When explicit cycleIds are provided (e.g. from teamspace), use them.
  // When a single cycleId is provided (e.g. from cycle detail page), use it.
  // Otherwise render all active cycles (supports parallel cycles).
  const activeCycleIds =
    propsCycleIds && propsCycleIds.length > 0
      ? propsCycleIds
      : propsCycleId
        ? [propsCycleId]
        : activeCyclesForProject.length > 0
          ? activeCyclesForProject
          : currentProjectActiveCycleId
            ? [currentProjectActiveCycleId]
            : [];

  const [isOpen, setIsOpen] = useState(true);

  const content =
    activeCycleIds.length === 0 ? (
      <ActiveCyclesComponent
        cycleId={undefined}
        activeCycle={null}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        handleFiltersUpdate={() => {}}
      />
    ) : (
      <>
        {activeCycleIds.map((id) => (
          <ActiveCycleEntry key={id} cycleId={id} workspaceSlug={workspaceSlug} projectId={projectId} />
        ))}
      </>
    );

  return (
    <>
      {showHeader ? (
        <Collapsible className="flex flex-shrink-0 flex-col" open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-subtle bg-layer-1 cursor-pointer">
            <CycleListGroupHeader title={t("project_cycles.active_cycle.label")} type="current" isExpanded={isOpen} />
          </CollapsibleTrigger>
          <CollapsibleContent>{content}</CollapsibleContent>
        </Collapsible>
      ) : (
        content
      )}
    </>
  );
});
