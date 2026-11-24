/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@makeplane/propel/components/button";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useTeam } from "@/hooks/store/use-team";
// local imports
import { MoveProjectsDialog } from "./move-projects-dialog";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

/** Project setting that moves the project to another portfolio. */
export const ProjectPortfolioControl = observer(function ProjectPortfolioControl(props: Props) {
  const { workspaceSlug, projectId } = props;
  const [isOpen, setIsOpen] = useState(false);
  const { getProjectById } = useProject();
  const { isEnabled, isWorkspaceAdmin, portfolioMap, teamMap, canManageTeam, getTeamPortfolios } = useTeam();
  const { t } = useTranslation();
  // derived values
  const portfolio = portfolioMap[getProjectById(projectId)?.portfolio ?? ""];
  const team = portfolio ? teamMap[portfolio.team] : undefined;
  const canMove = isWorkspaceAdmin || (!!team && canManageTeam(team.id));

  if (!isEnabled || !canMove) return null;

  return (
    <>
      <MoveProjectsDialog
        isOpen={isOpen}
        workspaceSlug={workspaceSlug}
        projectIds={[projectId]}
        // team admins move projects only inside their own team
        portfolios={!isWorkspaceAdmin && team ? getTeamPortfolios(team.id, false) : undefined}
        onClose={() => setIsOpen(false)}
      />
      <SettingsBoxedControlItem
        className="mb-4"
        title={t("team_structure.portfolio")}
        description={portfolio ? `${team?.name ?? ""} / ${portfolio.name}` : t("team_structure.without_portfolio")}
        control={
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label={t("team_structure.move.action")}
            onClick={() => setIsOpen(true)}
          />
        }
      />
    </>
  );
});
