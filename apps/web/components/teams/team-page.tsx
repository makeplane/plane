/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Badge } from "@makeplane/propel/components/badge";
import { Button } from "@makeplane/propel/components/button";
import { Tab, Tabs, TabsList, TabsPanel } from "@makeplane/propel/components/tabs";
// plane imports
import { ConfirmDialog } from "@plane/blocks/dialog";
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { ProductBoardRoot } from "@/components/product-board/root";
import { TeamProductList } from "@/components/products/product-list";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useTeam } from "@/hooks/store/use-team";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { EntityFormDialog } from "./entity-form-dialog";
import { TeamMembersSection } from "./members-section";
import { PortfolioCard } from "./portfolio-card";
import { TeamFormDialog } from "./team-form-dialog";
import { useTeamAction } from "./use-team-action";

type Props = {
  workspaceSlug: string;
  teamId: string;
};

export const TeamPage = observer(function TeamPage(props: Props) {
  const { workspaceSlug, teamId } = props;
  // states
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // hooks
  const {
    canSeeProductBoard,
    teamMap,
    getTeamPortfolios,
    canManageTeam,
    isWorkspaceAdmin,
    createPortfolio,
    deleteTeam,
    setTeamArchived,
  } = useTeam();
  const router = useAppRouter();
  const run = useTeamAction();
  const { t } = useTranslation();
  // derived values
  const team = teamMap[teamId];
  const canManage = canManageTeam(teamId);

  if (!team) return <p className="text-body-sm-regular text-tertiary">{t("team_structure.not_found")}</p>;

  const isManagement = team.kind === "management";
  const isBoardShown = isManagement && !team.archived_at && canSeeProductBoard;
  const portfolios = getTeamPortfolios(teamId, canManage);

  const handleDelete = async () => {
    setIsDeleting(true);
    const isDone = await run(() => deleteTeam(workspaceSlug, teamId));
    setIsDeleting(false);
    setIsDeleteOpen(false);
    if (isDone) router.push(`/${workspaceSlug}/settings/teams`);
  };

  return (
    <>
      <PageHead title={team.name} />
      <TeamFormDialog
        isOpen={isEditOpen}
        workspaceSlug={workspaceSlug}
        team={team}
        onClose={() => setIsEditOpen(false)}
      />
      <EntityFormDialog
        isOpen={isPortfolioOpen}
        title={t("team_structure.create_portfolio")}
        submitLabel={t("team_structure.create_portfolio")}
        onClose={() => setIsPortfolioOpen(false)}
        onSubmit={(values) => run(() => createPortfolio(workspaceSlug, teamId, values))}
      />
      <ConfirmDialog
        isOpen={isDeleteOpen}
        isSubmitting={isDeleting}
        title={t("team_structure.delete_team.title")}
        content={t("team_structure.delete_team.description", { name: team.name })}
        handleClose={() => setIsDeleteOpen(false)}
        handleSubmit={handleDelete}
      />
      <div className="space-y-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-h3-medium text-primary">{team.name}</h3>
            {isManagement && <Badge size="sm" variant="brand" label={t("team_structure.kinds.management")} />}
            {team.archived_at && <Badge size="sm" variant="neutral" label={t("team_structure.archived")} />}
          </div>
          {team.description && <p className="text-body-sm-regular text-tertiary">{team.description}</p>}
        </div>
        <Tabs variant="underline" defaultValue={isBoardShown ? "board" : isManagement ? "members" : "portfolios"}>
          <TabsList>
            {isBoardShown && <Tab value="board" label={t("product_board.title")} />}
            {!isManagement && <Tab value="portfolios" label={t("team_structure.portfolios")} />}
            {!isManagement && <Tab value="products" label={t("product.products")} />}
            <Tab value="members" label={t("members")} />
            {canManage && <Tab value="settings" label={t("settings")} />}
          </TabsList>
          {isBoardShown && (
            <TabsPanel value="board">
              <div className="h-[calc(100vh-15rem)] min-h-96 pt-4">
                <ProductBoardRoot workspaceSlug={workspaceSlug} isEmbedded />
              </div>
            </TabsPanel>
          )}
          {!isManagement && (
            <TabsPanel value="portfolios">
              <div className="space-y-4 pt-4">
                {canManage && !team.archived_at && (
                  <Button
                    variant="primary"
                    size="md"
                    stretch="auto"
                    label={t("team_structure.create_portfolio")}
                    onClick={() => setIsPortfolioOpen(true)}
                  />
                )}
                {portfolios.length === 0 && (
                  <p className="text-body-sm-regular text-tertiary">{t("team_structure.no_portfolios")}</p>
                )}
                {portfolios.map((portfolio) => (
                  <PortfolioCard key={portfolio.id} workspaceSlug={workspaceSlug} portfolio={portfolio} />
                ))}
              </div>
            </TabsPanel>
          )}
          {!isManagement && (
            <TabsPanel value="products">
              <div className="pt-4">
                <TeamProductList workspaceSlug={workspaceSlug} teamId={teamId} />
              </div>
            </TabsPanel>
          )}
          <TabsPanel value="members">
            <div className="pt-4">
              <TeamMembersSection workspaceSlug={workspaceSlug} teamId={teamId} />
            </div>
          </TabsPanel>
          {canManage && (
            <TabsPanel value="settings">
              <div className="space-y-4 pt-4">
                <SettingsBoxedControlItem
                  title={t("team_structure.edit_team")}
                  control={
                    <Button
                      variant="secondary"
                      size="sm"
                      stretch="auto"
                      label={t("edit")}
                      onClick={() => setIsEditOpen(true)}
                    />
                  }
                />
                {isWorkspaceAdmin && (
                  <>
                    <SettingsBoxedControlItem
                      title={team.archived_at ? t("restore") : t("archive")}
                      description={t("team_structure.archive_hint")}
                      control={
                        <Button
                          variant="secondary"
                          size="sm"
                          stretch="auto"
                          label={team.archived_at ? t("restore") : t("archive")}
                          onClick={() => void run(() => setTeamArchived(workspaceSlug, teamId, !team.archived_at))}
                        />
                      }
                    />
                    <SettingsBoxedControlItem
                      title={t("delete")}
                      description={t("team_structure.delete_hint")}
                      control={
                        <Button
                          variant="danger-outline"
                          size="sm"
                          stretch="auto"
                          label={t("delete")}
                          onClick={() => setIsDeleteOpen(true)}
                        />
                      }
                    />
                  </>
                )}
              </div>
            </TabsPanel>
          )}
        </Tabs>
      </div>
    </>
  );
});
