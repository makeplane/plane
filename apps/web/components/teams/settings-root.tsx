/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { Checkbox } from "@makeplane/propel/components/checkbox";
import { Switch } from "@makeplane/propel/components/switch";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProject, TTeam } from "@plane/types";
// components
import { DataTable } from "@/components/common/data-table";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useTeam } from "@/hooks/store/use-team";
import { useWorkspace } from "@/hooks/store/use-workspace";
// local imports
import { MoveProjectsDialog } from "./move-projects-dialog";
import { TeamFormDialog } from "./team-form-dialog";
import { useTeamAction } from "./use-team-action";

type Props = {
  workspaceSlug: string;
};

export const TeamsSettingsRoot = observer(function TeamsSettingsRoot(props: Props) {
  const { workspaceSlug } = props;
  // states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // store hooks
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const { teams, unassignedProjects, fetchStructure } = useTeam();
  const run = useTeamAction();
  const { t } = useTranslation();
  const { isLoading } = useSWR(`TEAM_STRUCTURE_SETTINGS_${workspaceSlug}`, () => fetchStructure(workspaceSlug));
  // projects leave the list once they are moved
  const selected = unassignedProjects.filter((project) => selectedIds.includes(project.id)).map(({ id }) => id);

  const toggleProject = (projectId: string, isSelected: boolean) =>
    setSelectedIds((ids) => (isSelected ? [...ids, projectId] : ids.filter((id) => id !== projectId)));

  const teamColumns = [
    {
      key: "name",
      content: t("name"),
      tdRender: (team: TTeam) => (
        <Link href={`/${workspaceSlug}/teams/${team.id}`} className="text-accent-primary hover:underline">
          {team.name}
        </Link>
      ),
    },
    {
      key: "kind",
      content: t("team_structure.kind"),
      tdRender: (team: TTeam) => (
        <div className="flex items-center gap-2">
          {t(`team_structure.kinds.${team.kind}`)}
          {team.archived_at && <Badge size="xs" variant="neutral" label={t("team_structure.archived")} />}
        </div>
      ),
    },
  ];

  const projectColumns = [
    {
      key: "select",
      content: "",
      tdRender: (project: TProject) => (
        <Checkbox
          aria-label={project.name}
          checked={selected.includes(project.id)}
          onCheckedChange={(isSelected) => toggleProject(project.id, isSelected)}
        />
      ),
    },
    { key: "name", content: t("name"), tdRender: (project: TProject) => project.name },
    { key: "identifier", content: "ID", tdRender: (project: TProject) => project.identifier },
  ];

  return (
    <div className="flex w-full flex-col gap-y-8">
      <TeamFormDialog isOpen={isCreateOpen} workspaceSlug={workspaceSlug} onClose={() => setIsCreateOpen(false)} />
      <MoveProjectsDialog
        isOpen={isMoveOpen}
        workspaceSlug={workspaceSlug}
        projectIds={selected}
        onClose={() => setIsMoveOpen(false)}
      />
      <SettingsHeading
        title={t("team_structure.teams")}
        description={t("team_structure.settings_description")}
        control={
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={t("team_structure.create_team")}
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("team_structure.enable.title")}
        description={t("team_structure.enable.description")}
        control={
          <Switch
            size="sm"
            checked={!!currentWorkspace?.is_team_structure_enabled}
            onCheckedChange={(isEnabled) =>
              void run(() => updateWorkspace(workspaceSlug, { is_team_structure_enabled: isEnabled }))
            }
            aria-label={t("team_structure.enable.title")}
          />
        }
      />
      <DataTable columns={teamColumns} data={teams} keyExtractor={(team) => team.id} isLoading={isLoading} />
      {unassignedProjects.length > 0 && (
        <div className="space-y-4">
          <SettingsHeading
            variant="h5"
            title={t("team_structure.without_portfolio")}
            description={t("team_structure.without_portfolio_hint")}
            control={
              <Button
                variant="secondary"
                size="md"
                stretch="auto"
                label={t("team_structure.move.title")}
                disabled={selected.length === 0}
                onClick={() => setIsMoveOpen(true)}
              />
            }
          />
          <DataTable columns={projectColumns} data={unassignedProjects} keyExtractor={(project) => project.id} />
        </div>
      )}
    </div>
  );
});
