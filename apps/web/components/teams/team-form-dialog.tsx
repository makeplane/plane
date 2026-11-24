/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Select } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { TTeam, TTeamKind } from "@plane/types";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useTeam } from "@/hooks/store/use-team";
// local imports
import { EntityFormDialog } from "./entity-form-dialog";
import { useTeamAction } from "./use-team-action";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  team?: TTeam;
  onClose: () => void;
};

const KINDS: TTeamKind[] = ["regular", "management"];

export const TeamFormDialog = observer(function TeamFormDialog(props: Props) {
  const { isOpen, workspaceSlug, team, onClose } = props;
  const [kind, setKind] = useState<TTeamKind>("regular");
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const { createTeam, updateTeam, isWorkspaceAdmin } = useTeam();
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const run = useTeamAction();
  const { t } = useTranslation();
  const teamKind = team?.kind ?? "regular";

  useEffect(() => {
    if (!isOpen) return;
    setKind(teamKind);
    setAdminIds([]);
  }, [isOpen, teamKind]);

  const kindLabel = (value: TTeamKind) => t(`team_structure.kinds.${value}`);

  return (
    <EntityFormDialog
      isOpen={isOpen}
      title={team ? t("team_structure.edit_team") : t("team_structure.create_team")}
      submitLabel={team ? t("save") : t("team_structure.create_team")}
      defaultValues={team}
      onClose={onClose}
      onSubmit={(values) =>
        run(() =>
          team
            ? // only a workspace admin may send the kind
              updateTeam(workspaceSlug, team.id, kind === team.kind ? values : { ...values, kind })
            : createTeam(workspaceSlug, { ...values, kind, admin_ids: adminIds })
        )
      }
    >
      {isWorkspaceAdmin && (
        <div className="space-y-1">
          <p className="text-body-xs-medium text-secondary">{t("team_structure.kind")}</p>
          <Select<TTeamKind>
            getValues={() => KINDS}
            value={kind}
            onChange={(value) => setKind(value as TTeamKind)}
            getOptionValue={String}
            getOptionLabel={kindLabel}
            showSearch={false}
            pinSelected={false}
          >
            <Select.Trigger<TTeamKind> variant="select-md">
              <span className="truncate">{kindLabel(kind)}</span>
            </Select.Trigger>
          </Select>
        </div>
      )}
      {!team && (
        <div className="space-y-1">
          <p className="text-body-xs-medium text-secondary">{t("team_structure.admins")}</p>
          <MemberSelect
            multiple
            value={adminIds}
            onChange={setAdminIds}
            memberIds={(workspaceMemberIds ?? []).filter((id) => Number(getWorkspaceMemberDetails(id)?.role) > 5)}
            placeholder={t("team_structure.select_members")}
            variant="select-md"
          />
          <p className="text-body-xs-regular text-tertiary">{t("team_structure.admins_hint")}</p>
        </div>
      )}
    </EntityFormDialog>
  );
});
