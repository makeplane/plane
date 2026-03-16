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

import { useEffect, useMemo, useState } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@plane/propel/collapsible";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { useTranslation } from "@plane/i18n";
import { CycleProgressHeader } from "@/components/cycles/active-cycles/v2/progress-header";
import { CycleListGroupHeader } from "@/components/cycles/list/cycle-list-group-header";
import { useCycle } from "@/hooks/store/use-cycle";
// local imports
import { ActiveCycleDetails } from "./details";
import { ActiveCycleCompactRow } from "./compact-row";
import { useActiveCycleDetails } from "./use-active-cycle-details";

type ActiveCycleRootProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
  cycleIds?: string[];
  showHeader?: boolean;
};

// Renders details for a single explicitly-provided cycle ID
const ActiveCycleEntry = observer(function ActiveCycleEntry({
  cycleId,
  workspaceSlug,
  projectId,
  onCollapse,
}: {
  cycleId: string;
  workspaceSlug: string;
  projectId: string;
  onCollapse?: () => void;
}) {
  const cycleDetails = useActiveCycleDetails({
    workspaceSlug,
    projectId,
    cycleId,
  });

  if (!cycleDetails.cycle || isEmpty(cycleDetails.cycle)) return null;

  return (
    <div className="flex flex-shrink-0 flex-col border-b border-subtle-1">
      <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-subtle-1 bg-layer-1 cursor-pointer">
        <div className="flex items-center bg-surface-1">
          {onCollapse && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCollapse();
              }}
              className="flex items-center justify-center flex-shrink-0 bg-surface-1 pl-2"
            >
              <ChevronDown className="size-4 text-tertiary" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <CycleProgressHeader
              cycleDetails={cycleDetails.cycle}
              progress={cycleDetails.cycleProgress}
              projectId={projectId}
              cycleId={cycleDetails.cycle?.id || ""}
              workspaceSlug={workspaceSlug}
            />
          </div>
        </div>
      </div>
      <div>
        <ActiveCycleDetails {...cycleDetails} />
      </div>
    </div>
  );
});

export const ActiveCycleRoot = observer(function ActiveCycleRoot(props: ActiveCycleRootProps) {
  const { workspaceSlug, projectId, cycleId: propsCycleId, cycleIds: propsCycleIds } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getActiveCycleIds, currentProjectActiveCycleId } = useCycle();
  const activeCyclesForProject = getActiveCycleIds(projectId);

  // When explicit cycleIds are provided (e.g. from teamspace), use them.
  // When a single cycleId is provided, render only that cycle.
  // Otherwise render all active cycles (supports parallel cycles).
  const activeCycleIds = useMemo(
    () =>
      propsCycleIds && propsCycleIds.length > 0
        ? propsCycleIds
        : propsCycleId
          ? [propsCycleId]
          : activeCyclesForProject.length > 0
            ? activeCyclesForProject
            : currentProjectActiveCycleId
              ? [currentProjectActiveCycleId]
              : [],
    [propsCycleIds, propsCycleId, activeCyclesForProject, currentProjectActiveCycleId]
  );

  // Track which cycles are expanded (first one expanded by default, multiple allowed)
  const [expandedCycleIds, setExpandedCycleIds] = useState<Set<string>>(() => new Set([activeCycleIds[0]]));
  // Collapsible section state for the "Active N" header
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  // Sync expandedCycleIds only when the actual set of active cycle IDs changes
  // (not on every render — activeCycleIds gets a new array reference from MobX each time)
  const activeCycleIdsKey = activeCycleIds.join(",");
  useEffect(() => {
    setExpandedCycleIds((prev) => {
      const stillValid = new Set([...prev].filter((id) => activeCycleIds.includes(id)));
      if (stillValid.size > 0) return stillValid;
      return activeCycleIds.length > 0 ? new Set([activeCycleIds[0]]) : new Set();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCycleIdsKey]);

  const handleToggleCycle = (id: string) => {
    setExpandedCycleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (activeCycleIds.length === 0) {
    return (
      <EmptyStateDetailed
        assetKey="cycle"
        title={t("project_cycles.empty_state.active.title")}
        description={t("project_cycles.empty_state.active.description")}
        rootClassName="py-10 h-auto"
      />
    );
  }

  // Collapsible "Active N" header with individually expandable/collapsible cycle entries
  return (
    <Collapsible className="flex shrink-0 flex-col" open={isSectionOpen} onOpenChange={setIsSectionOpen}>
      <CollapsibleTrigger className="sticky top-0 z-[2] w-full shrink-0 border-b border-subtle bg-layer-1 cursor-pointer">
        <CycleListGroupHeader
          title={t("project_cycles.active_cycle.label")}
          type="current"
          count={activeCycleIds.length}
          showCount
          isExpanded={isSectionOpen}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {activeCycleIds.map((id) =>
          expandedCycleIds.has(id) ? (
            <ActiveCycleEntry
              key={id}
              cycleId={id}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              onCollapse={() => handleToggleCycle(id)}
            />
          ) : (
            <ActiveCycleCompactRow
              key={id}
              cycleId={id}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              onToggle={() => handleToggleCycle(id)}
            />
          )
        )}
      </CollapsibleContent>
    </Collapsible>
  );
});
