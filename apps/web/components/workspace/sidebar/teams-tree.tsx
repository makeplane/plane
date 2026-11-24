/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Collapsible } from "@makeplane/propel/components/collapsible";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ListItem, ListItemLabel, ListItemLink } from "@makeplane/propel/elements/list";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { AddOutline } from "@makeplane/propel/icons";
// plane imports
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TProject, TTeam } from "@plane/types";
import { copyUrlToClipboard } from "@plane/utils";
// components
import { CreateProjectModal } from "@/components/project/create-project-modal";
// hooks
import { useTeam } from "@/hooks/store/use-team";
import useLocalStorage from "@/hooks/use-local-storage";
// local imports
import { SidebarProjectsListItem } from "./projects-list-item";

type TProjectsProps = { projects: TProject[] };

const TreeProjects = observer(function TreeProjects({ projects }: TProjectsProps) {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  const handleCopyText = (projectId: string) => {
    void copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/issues`).then(() =>
      setToast({ type: "success", title: t("link_copied"), message: t("project_link_copied_to_clipboard") })
    );
  };

  return (
    <>
      {projects.map((project, index) =>
        project.member_role ? (
          <SidebarProjectsListItem
            key={project.id}
            projectId={project.id}
            handleCopyText={() => handleCopyText(project.id)}
            projectListType="JOINED"
            disableDrag
            disableDrop
            isLastChild={index === projects.length - 1}
          />
        ) : (
          <ListItem key={project.id} density="comfortable">
            <ListItemLink render={<Link href={`/${workspaceSlug}/projects/${project.id}/issues`} />}>
              <Logo logo={project.logo_props} size={16} />
              <ListItemLabel>{project.name}</ListItemLabel>
            </ListItemLink>
          </ListItem>
        )
      )}
    </>
  );
});

type TTeamNodeProps = { team: TTeam };

const TeamNode = observer(function TeamNode({ team }: TTeamNodeProps) {
  const { workspaceSlug } = useParams();
  const { getTeamPortfolios, getPortfolioProjects } = useTeam();
  const { t } = useTranslation();
  // the user's own teams start open
  const { storedValue: isOpen, setValue: setIsOpen } = useLocalStorage<boolean>(
    `sidebar_team_${team.id}_open`,
    !!team.member_role
  );

  return (
    <Collapsible
      placement="sidebar"
      open={!!isOpen}
      onOpenChange={setIsOpen}
      trigger={<span className="truncate text-body-xs-semibold text-secondary">{team.name}</span>}
    >
      <div className="flex w-full flex-col gap-px pl-2">
        <ListItem density="comfortable">
          <ListItemLink render={<Link href={`/${workspaceSlug}/teams/${team.id}`} />}>
            <ListItemLabel>{t("common.overview")}</ListItemLabel>
          </ListItemLink>
        </ListItem>
        {getTeamPortfolios(team.id, false).map((portfolio) => (
          <div key={portfolio.id}>
            <Link
              href={`/${workspaceSlug}/portfolios/${portfolio.id}`}
              className="block truncate px-2 pt-2 pb-1 text-caption-sm-medium text-tertiary hover:text-secondary"
            >
              {portfolio.name}
            </Link>
            <TreeProjects projects={getPortfolioProjects(portfolio.id)} />
          </div>
        ))}
      </div>
    </Collapsible>
  );
});

/** Sidebar navigation of workspaces that use the team structure: team, portfolio, project. */
export const SidebarTeamsTree = observer(function SidebarTeamsTree() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { workspaceSlug } = useParams();
  const { activeTeams, unassignedProjects, canCreateProject } = useTeam();
  const { t } = useTranslation();
  const ownUnassigned = unassignedProjects.filter((project) => !!project.member_role);

  return (
    <div className="flex flex-col gap-1">
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          setToFavorite={false}
          workspaceSlug={workspaceSlug.toString()}
        />
      )}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-body-xs-semibold text-tertiary">{t("team_structure.teams")}</span>
        {canCreateProject && (
          <Tooltip label={t("create_project")}>
            <IconButton
              variant="ghost"
              size="xs"
              showTooltip={false}
              icon={<Icon icon={AddOutline} />}
              onClick={() => setIsCreateOpen(true)}
              aria-label={t("aria_labels.projects_sidebar.create_new_project")}
            />
          </Tooltip>
        )}
      </div>
      {activeTeams.map((team) => (
        <TeamNode key={team.id} team={team} />
      ))}
      {ownUnassigned.length > 0 && (
        <div className="pt-2">
          <p className="px-2 py-1 text-body-xs-semibold text-tertiary">{t("team_structure.without_portfolio")}</p>
          <TreeProjects projects={ownUnassigned} />
        </div>
      )}
    </div>
  );
});
