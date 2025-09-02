"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { CircleMinus } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles, TTeamspace } from "@plane/types";
import {
  AlertModalCore,
  Avatar,
  AvatarGroup,
  CustomMenu,
  Logo,
  setToast,
  Table,
  TeamsIcon,
  TOAST_TYPE,
} from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member"
import { useProject } from "@/hooks/store/use-project"
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  teamspaceIds: string[];
};

export const ProjectTeamspaceListItem: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, teamspaceIds } = props;
  // states
  const [selectedTeamspaceIdToRemove, setSelectedTeamspaceIdToRemove] = useState<string | null>(null);
  const [isRemovingTeamspace, setIsRemovingTeamspace] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  const { getTeamspaceById, getTeamspaceMemberIds, isCurrentUserMemberOfTeamspace, removeTeamspaceFromProject } =
    useTeamspaces();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const hasWorkspaceAdminPermission = allowPermissions(
    [EUserWorkspaceRoles.ADMIN],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug,
    projectId
  );
  const projectDetails = getProjectById(projectId);
  const teamspaceDetails = teamspaceIds.map((teamspaceId) => getTeamspaceById(teamspaceId));
  const teamspaceToRemoveDetails = useMemo(
    () => (selectedTeamspaceIdToRemove ? getTeamspaceById(selectedTeamspaceIdToRemove) : null),
    [selectedTeamspaceIdToRemove, getTeamspaceById]
  );
  const teamspaceColumns = useMemo(
    () => [
      {
        key: "teamspaceName",
        content: t("teamspace_projects.settings.table.columns.teamspaceName"),
        thClassName: "text-left",
        tdRender: (rowData: TTeamspace) => (
          <div className="flex group relative items-center gap-2 pt-1">
            {rowData.logo_props?.in_use ? (
              <Logo logo={rowData.logo_props} size={16} />
            ) : (
              <TeamsIcon className="size-4 text-custom-text-300" />
            )}
            <div>{rowData.name}</div>
            {hasWorkspaceAdminPermission && isCurrentUserMemberOfTeamspace(rowData.id) && (
              <CustomMenu
                ellipsis
                buttonClassName="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                optionsClassName="p-1.5"
                placement="bottom-end"
              >
                <CustomMenu.MenuItem>
                  <div
                    className="flex items-center gap-x-1 cursor-pointer text-red-600 font-medium"
                    onClick={() => setSelectedTeamspaceIdToRemove(rowData.id)}
                  >
                    <CircleMinus className="flex-shrink-0 size-3.5" />
                    {t("teamspace_projects.settings.table.actions.remove.button.text")}
                  </div>
                </CustomMenu.MenuItem>
              </CustomMenu>
            )}
          </div>
        ),
      },
      {
        key: "members",
        content: t("teamspace_projects.settings.table.columns.members"),
        tdRender: (rowData: TTeamspace) => (
          <div className="flex-shrink-0">
            <AvatarGroup size="md" showTooltip max={3}>
              {getTeamspaceMemberIds(rowData.id)?.map((userId: string) => {
                const userDetails = getUserDetails(userId);
                if (!userDetails) return;
                return <Avatar key={userId} src={getFileURL(userDetails.avatar_url)} name={userDetails.display_name} />;
              })}
            </AvatarGroup>
          </div>
        ),
      },
      {
        key: "accountType",
        content: t("teamspace_projects.settings.table.columns.accountType"),
        tdRender: () => <div>{t("common.member")}</div>,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getTeamspaceMemberIds, getUserDetails, hasWorkspaceAdminPermission, isCurrentUserMemberOfTeamspace]
  );

  const handleRemove = async (teamspaceId: string | null) => {
    if (!workspaceSlug || !projectId || !teamspaceId) return;
    setIsRemovingTeamspace(true);
    await removeTeamspaceFromProject(workspaceSlug, projectId, teamspaceId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("teamspace_projects.settings.toast.remove_teamspace.success.title"),
          message: t("teamspace_projects.settings.toast.remove_teamspace.success.description", {
            teamspaceName: teamspaceToRemoveDetails?.name,
            projectName: projectDetails?.name,
          }),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("teamspace_projects.settings.toast.remove_teamspace.error.title"),
          message: t("teamspace_projects.settings.toast.remove_teamspace.error.description"),
        });
      })
      .finally(() => {
        setIsRemovingTeamspace(false);
        setSelectedTeamspaceIdToRemove(null);
      });
  };

  if (teamspaceIds.length === 0)
    return (
      <div className="text-center text-sm text-custom-text-300 mt-6">
        {t("teamspace_projects.settings.table.empty_state.no_results.title")}
      </div>
    );

  return (
    <>
      <AlertModalCore
        isOpen={!!selectedTeamspaceIdToRemove}
        title={t("teamspace_projects.settings.table.actions.remove.confirm.title", {
          teamspaceName: teamspaceToRemoveDetails?.name,
          projectName: projectDetails?.name,
        })}
        content={t("teamspace_projects.settings.table.actions.remove.confirm.description")}
        handleClose={() => setSelectedTeamspaceIdToRemove(null)}
        handleSubmit={() => handleRemove(selectedTeamspaceIdToRemove)}
        isSubmitting={isRemovingTeamspace}
        primaryButtonText={{
          loading: t("common.confirming"),
          default: t("common.remove"),
        }}
        secondaryButtonText={t("common.cancel")}
        variant="danger"
      />
      <Table
        columns={teamspaceColumns}
        data={teamspaceDetails?.filter((teamspace): teamspace is TTeamspace => teamspace !== null) ?? []}
        keyExtractor={(rowData) => rowData.id}
        tHeadClassName="mb-4 border-b border-custom-border-100"
        thClassName="text-left text-custom-text-400 font-medium divide-x-0"
        tBodyClassName="divide-y-0"
        tBodyTrClassName="divide-x-0"
        tHeadTrClassName="divide-x-0"
      />
    </>
  );
});
