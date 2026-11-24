/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Avatar } from "@makeplane/propel/components/avatar";
import { Button } from "@makeplane/propel/components/button";
// plane imports
import { Select } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import { ETeamRole } from "@plane/types";
import type { TTeamMember } from "@plane/types";
import { getFileURL } from "@plane/utils";
// components
import { DataTable } from "@/components/common/data-table";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useTeam } from "@/hooks/store/use-team";
import { useUser } from "@/hooks/store/user";
// local imports
import { useTeamAction } from "./use-team-action";

type Props = {
  workspaceSlug: string;
  teamId: string;
};

const ROLES = [ETeamRole.ADMIN, ETeamRole.MEMBER];

export const TeamMembersSection = observer(function TeamMembersSection(props: Props) {
  const { workspaceSlug, teamId } = props;
  // states
  const [newMemberIds, setNewMemberIds] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  // store hooks
  const { canManageTeam, getTeamMembers, fetchTeamMembers, addTeamMembers, updateTeamMember, removeTeamMember } =
    useTeam();
  const {
    getUserDetails,
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { data: currentUser } = useUser();
  const run = useTeamAction();
  const { t } = useTranslation();
  // derived values
  const canManage = canManageTeam(teamId);
  const members = getTeamMembers(teamId);
  const memberIds = new Set(members?.map((member) => member.member));
  // guests cannot be in a team
  const candidateIds = (workspaceMemberIds ?? []).filter(
    (id) => !memberIds.has(id) && Number(getWorkspaceMemberDetails(id)?.role) > 5
  );

  useSWR(`TEAM_MEMBERS_${workspaceSlug}_${teamId}`, () => fetchTeamMembers(workspaceSlug, teamId));

  const perform = async (action: () => Promise<void>) => {
    setIsBusy(true);
    const isDone = await run(action);
    setIsBusy(false);
    return isDone;
  };

  const handleAdd = async () => {
    const isDone = await perform(() => addTeamMembers(workspaceSlug, teamId, newMemberIds, ETeamRole.MEMBER));
    if (isDone) setNewMemberIds([]);
  };

  const roleLabel = (role: ETeamRole) =>
    role === ETeamRole.ADMIN ? t("team_structure.roles.admin") : t("team_structure.roles.member");

  const columns = [
    {
      key: "member",
      content: t("name"),
      tdRender: (row: TTeamMember) => {
        const user = getUserDetails(row.member);
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm" src={getFileURL(user?.avatar_url ?? "")} alt={user?.display_name ?? ""} />
            <span className="truncate">{user?.display_name}</span>
          </div>
        );
      },
    },
    {
      key: "role",
      content: t("role"),
      tdRender: (row: TTeamMember) =>
        canManage ? (
          <Select<ETeamRole>
            getValues={() => ROLES}
            value={row.role}
            onChange={(role) => {
              if (Number(role) !== row.role)
                void perform(() => updateTeamMember(workspaceSlug, teamId, row.id, Number(role) as ETeamRole));
            }}
            getOptionValue={String}
            getOptionLabel={roleLabel}
            showSearch={false}
            pinSelected={false}
            disabled={isBusy}
          >
            <Select.Trigger<ETeamRole> variant="select-ghost-md">
              <span className="truncate">{roleLabel(row.role)}</span>
            </Select.Trigger>
          </Select>
        ) : (
          roleLabel(row.role)
        ),
    },
    {
      key: "actions",
      content: "",
      tdRender: (row: TTeamMember) => {
        const isSelf = row.member === currentUser?.id;
        if (!canManage && !isSelf) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            stretch="auto"
            disabled={isBusy}
            label={isSelf ? t("leave") : t("remove")}
            onClick={() => void perform(() => removeTeamMember(workspaceSlug, teamId, row.id))}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <MemberSelect
            multiple
            value={newMemberIds}
            onChange={setNewMemberIds}
            memberIds={candidateIds}
            placeholder={t("team_structure.select_members")}
            variant="select-md"
            disabled={isBusy}
          />
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={t("add")}
            disabled={newMemberIds.length === 0}
            loading={isBusy}
            onClick={() => void handleAdd()}
          />
        </div>
      )}
      <DataTable columns={columns} data={members ?? []} keyExtractor={(row) => row.id} isLoading={!members} />
    </div>
  );
});
