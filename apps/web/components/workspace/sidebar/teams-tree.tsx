/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Collapsible } from "@makeplane/propel/components/collapsible";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ListItem, ListItemLabel, ListItemLink } from "@makeplane/propel/elements/list";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { AddOutline, BoardOutline, MoreHorizontalOutline } from "@makeplane/propel/icons";
// plane imports
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TPortfolio, TProject, TTeam } from "@plane/types";
import { copyUrlToClipboard } from "@plane/utils";
// components
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { EntityFormDialog } from "@/components/teams/entity-form-dialog";
import { useTeamAction } from "@/components/teams/use-team-action";
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

type TNodeMenuProps = { label: string; children: ReactNode };

/** Three-dots menu of a tree node. Always in the tab order, so it is reachable without a mouse. */
function NodeMenu({ label, children }: TNodeMenuProps) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton variant="ghost" size="xs" icon={<Icon icon={MoreHorizontalOutline} />} aria-label={label} />
        }
      />
      <MenuContent side="bottom" align="start">
        {children}
      </MenuContent>
    </Menu>
  );
}

type TPortfolioNodeProps = { portfolio: TPortfolio };

const PortfolioNode = observer(function PortfolioNode({ portfolio }: TPortfolioNodeProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const { canManageTeam, getPortfolioProjects } = useTeam();
  const { t } = useTranslation();
  const { storedValue: isOpen, setValue: setIsOpen } = useLocalStorage<boolean>(
    `sidebar_portfolio_${portfolio.id}_open`,
    true
  );
  const projects = getPortfolioProjects(portfolio.id);

  return (
    <>
      {workspaceSlug && (
        <CreateProjectModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          workspaceSlug={workspaceSlug.toString()}
          data={{ portfolio_id: portfolio.id }}
        />
      )}
      <Collapsible
        placement="sidebar"
        open={!!isOpen}
        onOpenChange={setIsOpen}
        trigger={<span className="truncate text-body-xs-medium text-tertiary">{portfolio.name}</span>}
        trailing={
          <NodeMenu label={`${t("aria_labels.common.more_actions")}: ${portfolio.name}`}>
            <MenuItem
              label={t("common.overview")}
              onClick={() => router.push(`/${workspaceSlug}/portfolios/${portfolio.id}`)}
            />
            {canManageTeam(portfolio.team) && (
              <MenuItem label={t("create_project")} onClick={() => setIsCreateOpen(true)} />
            )}
          </NodeMenu>
        }
      >
        <div className="flex w-full flex-col gap-px pl-2">
          <TreeProjects projects={projects} />
          {projects.length === 0 && (
            <p className="px-2 py-1 text-caption-sm-regular text-placeholder">{t("team_structure.no_projects")}</p>
          )}
        </div>
      </Collapsible>
    </>
  );
});

const BoardLink = observer(function BoardLink() {
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const { t } = useTranslation();
  const href = `/${workspaceSlug?.toString()}/product-board`;

  return (
    <ListItem density="comfortable">
      <ListItemLink
        href={href}
        render={<Link href={href} />}
        aria-current={pathname.replace(/\/$/, "") === href ? "page" : undefined}
      >
        <BoardOutline className="size-4 shrink-0" />
        <ListItemLabel>{t("product_board.title")}</ListItemLabel>
      </ListItemLink>
    </ListItem>
  );
});

type TTeamNodeProps = { team: TTeam };

const TeamNode = observer(function TeamNode({ team }: TTeamNodeProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const { canManageTeam, canSeeProductBoard, createPortfolio, getTeamPortfolios } = useTeam();
  const run = useTeamAction();
  const { t } = useTranslation();
  // the user's own teams start open
  const { storedValue: isOpen, setValue: setIsOpen } = useLocalStorage<boolean>(
    `sidebar_team_${team.id}_open`,
    !!team.member_role
  );
  const portfolios = getTeamPortfolios(team.id, false);

  return (
    <>
      <EntityFormDialog
        isOpen={isCreateOpen}
        title={t("team_structure.create_portfolio")}
        submitLabel={t("team_structure.create_portfolio")}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(values) => run(() => createPortfolio(workspaceSlug?.toString() ?? "", team.id, values))}
      />
      <Collapsible
        placement="sidebar"
        open={!!isOpen}
        onOpenChange={setIsOpen}
        trigger={<span className="truncate text-body-xs-semibold text-secondary">{team.name}</span>}
        trailing={
          <NodeMenu label={`${t("aria_labels.common.more_actions")}: ${team.name}`}>
            <MenuItem label={t("common.overview")} onClick={() => router.push(`/${workspaceSlug}/teams/${team.id}`)} />
            {team.kind === "management" && canSeeProductBoard && (
              <MenuItem
                label={t("product_board.title")}
                onClick={() => router.push(`/${workspaceSlug}/product-board`)}
              />
            )}
            {team.kind === "regular" && canManageTeam(team.id) && (
              <MenuItem label={t("team_structure.create_portfolio")} onClick={() => setIsCreateOpen(true)} />
            )}
          </NodeMenu>
        }
      >
        <div className="flex w-full flex-col gap-px pl-2">
          {team.kind === "management" && canSeeProductBoard && <BoardLink />}
          {portfolios.map((portfolio) => (
            <PortfolioNode key={portfolio.id} portfolio={portfolio} />
          ))}
          {portfolios.length === 0 && team.kind === "regular" && (
            <p className="px-2 py-1 text-caption-sm-regular text-placeholder">{t("team_structure.no_portfolios")}</p>
          )}
        </div>
      </Collapsible>
    </>
  );
});

/** Sidebar navigation of workspaces that use the team structure: team, portfolio, project. */
export const SidebarTeamsTree = observer(function SidebarTeamsTree() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { workspaceSlug } = useParams();
  const { activeTeams, unassignedProjects, canCreateProject, canSeeProductBoard } = useTeam();
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
      {/* admins see the board before there is a management team to show it in */}
      {canSeeProductBoard && !activeTeams.some((team) => team.kind === "management") && <BoardLink />}
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
