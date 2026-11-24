/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { Badge } from "@makeplane/propel/components/badge";
import { Icon } from "@makeplane/propel/components/icon";
import { Button } from "@makeplane/propel/components/button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { MoreHorizontalOutline } from "@makeplane/propel/icons";
// plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
import { useTranslation } from "@plane/i18n";
import type { TPortfolio } from "@plane/types";
// components
import { CreateProjectModal } from "@/components/project/create-project-modal";
// hooks
import { useTeam } from "@/hooks/store/use-team";
// local imports
import { EntityFormDialog } from "./entity-form-dialog";
import { PortfolioProjects } from "./portfolio-projects";
import { useTeamAction } from "./use-team-action";

type Props = {
  workspaceSlug: string;
  portfolio: TPortfolio;
  /** Link the title to the portfolio page. */
  isLinked?: boolean;
  onDeleted?: () => void;
};

export const PortfolioCard = observer(function PortfolioCard(props: Props) {
  const { workspaceSlug, portfolio, isLinked = true, onDeleted } = props;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { canManageTeam, teamMap, updatePortfolio, deletePortfolio, setPortfolioArchived } = useTeam();
  const run = useTeamAction();
  const { t } = useTranslation();
  // derived values
  const canManage = canManageTeam(portfolio.team);
  const canCreateProject = canManage && !portfolio.archived_at && !teamMap[portfolio.team]?.archived_at;

  const handleDelete = async () => {
    setIsDeleting(true);
    const isDone = await run(() => deletePortfolio(workspaceSlug, portfolio.id));
    setIsDeleting(false);
    setIsDeleteOpen(false);
    if (isDone) onDeleted?.();
  };

  return (
    <section className="space-y-2 rounded-lg border border-subtle bg-layer-2 p-4">
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        workspaceSlug={workspaceSlug}
        data={{ portfolio_id: portfolio.id }}
      />
      <EntityFormDialog
        isOpen={isEditOpen}
        title={t("team_structure.edit_portfolio")}
        submitLabel={t("save")}
        defaultValues={portfolio}
        onClose={() => setIsEditOpen(false)}
        onSubmit={(values) => run(() => updatePortfolio(workspaceSlug, portfolio.id, values))}
      />
      <ConfirmDialog
        isOpen={isDeleteOpen}
        isSubmitting={isDeleting}
        title={t("team_structure.delete_portfolio.title")}
        content={t("team_structure.delete_portfolio.description", { name: portfolio.name })}
        handleClose={() => setIsDeleteOpen(false)}
        handleSubmit={handleDelete}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="truncate text-body-md-medium text-primary">
            {isLinked ? (
              <Link href={`/${workspaceSlug}/portfolios/${portfolio.id}`}>{portfolio.name}</Link>
            ) : (
              portfolio.name
            )}
          </h4>
          {portfolio.archived_at && <Badge size="xs" variant="neutral" label={t("team_structure.archived")} />}
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            {canCreateProject && !isLinked && (
              <Button
                variant="primary"
                size="sm"
                stretch="auto"
                label={t("create_project")}
                onClick={() => setIsCreateOpen(true)}
              />
            )}
            <Menu>
              <MenuTrigger
                render={
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={t("aria_labels.common.more_actions")}
                    icon={<Icon icon={MoreHorizontalOutline} />}
                  />
                }
              />
              <MenuContent side="bottom" align="end">
                {canCreateProject && <MenuItem label={t("create_project")} onClick={() => setIsCreateOpen(true)} />}
                <MenuItem label={t("edit")} onClick={() => setIsEditOpen(true)} />
                <MenuItem
                  label={portfolio.archived_at ? t("restore") : t("archive")}
                  onClick={() =>
                    void run(() => setPortfolioArchived(workspaceSlug, portfolio.id, !portfolio.archived_at))
                  }
                />
                <MenuItem variant="danger" label={t("delete")} onClick={() => setIsDeleteOpen(true)} />
              </MenuContent>
            </Menu>
          </div>
        )}
      </div>
      {portfolio.description && <p className="text-body-xs-regular text-tertiary">{portfolio.description}</p>}
      <PortfolioProjects workspaceSlug={workspaceSlug} portfolioId={portfolio.id} />
    </section>
  );
});
