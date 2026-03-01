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
import { useTheme } from "next-themes";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@plane/propel/collapsible";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ContentWrapper, ERowVariant } from "@plane/ui";
// assets
import completedCyclesDark from "@/app/assets/empty-state/teams/completed-cycles-dark.webp?url";
import completedCyclesLight from "@/app/assets/empty-state/teams/completed-cycles-light.webp?url";
// components
import { CycleListProjectGroupHeader } from "@/components/cycles/list/cycle-list-project-group-header";
import { CyclesListMap } from "@/components/cycles/list/cycles-list-map";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// plane web imports
import { useTeamspaceCycles } from "@/plane-web/hooks/store";

type TeamCompletedCyclesRootProps = {
  teamspaceId: string;
  workspaceSlug: string;
};

const ProjectCycleCollapsible = observer(function ProjectCycleCollapsible({
  projectId,
  cycleIds,
  workspaceSlug,
}: {
  projectId: string;
  cycleIds: string[];
  workspaceSlug: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible className="flex flex-shrink-0 flex-col" open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-subtle-1 bg-layer-1 cursor-pointer">
        <CycleListProjectGroupHeader projectId={projectId} count={cycleIds.length} showCount isExpanded={isOpen} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CyclesListMap cycleIds={cycleIds} projectId={projectId} workspaceSlug={workspaceSlug} />
      </CollapsibleContent>
    </Collapsible>
  );
});

export const TeamCompletedCyclesRoot = observer(function TeamCompletedCyclesRoot(props: TeamCompletedCyclesRootProps) {
  const { teamspaceId, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // theme hook
  const { resolvedTheme } = useTheme();
  // store hooks
  const { getTeamspaceFilteredCompletedCycleIds, getTeamspaceGroupedCompletedCycleIds } = useTeamspaceCycles();
  // derived values
  const filteredCompletedCycleIds = getTeamspaceFilteredCompletedCycleIds(teamspaceId);
  const groupedCompletedCycleIds = getTeamspaceGroupedCompletedCycleIds(teamspaceId);
  const resolvedPath = resolvedTheme === "light" ? completedCyclesLight : completedCyclesDark;

  if (filteredCompletedCycleIds.length === 0) {
    return (
      <DetailedEmptyState
        title={t("teamspace_cycles.empty_state.completed.title")}
        description={t("teamspace_cycles.empty_state.completed.description")}
        assetPath={resolvedPath}
      />
    );
  }

  return (
    <ContentWrapper variant={ERowVariant.HUGGING}>
      {Object.entries(groupedCompletedCycleIds).map(([projectId, cycleIds]) => (
        <ProjectCycleCollapsible
          key={projectId}
          projectId={projectId}
          cycleIds={cycleIds}
          workspaceSlug={workspaceSlug}
        />
      ))}
    </ContentWrapper>
  );
});
