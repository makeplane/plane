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
// plane imports
import type { PermissionNamespace } from "@plane/types";
// components
import { DeleteRoleModal } from "@/components/roles-and-schemes/roles/delete-role-modal";
import { DisableRoleModal } from "@/components/roles-and-schemes/roles/disable-role-modal";
import { EditRoleModal } from "@/components/roles-and-schemes/roles/edit-role-modal";
import { EnableRoleModal } from "@/components/roles-and-schemes/roles/enable-role-modal";
import { RolesAndSchemesListLoader } from "./list-loader";
import { RoleCard } from "./role-card";
// hooks
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  workspaceSlug: string;
  namespace: PermissionNamespace;
  roleIds: string[] | undefined;
  canEdit: (roleId: string) => boolean;
  canDelete: (roleId: string) => boolean;
  canToggleStatus: (roleId: string) => boolean;
};

export const RolesListTab = observer(function RolesListTab(props: Props) {
  const { workspaceSlug, namespace, roleIds, canEdit, canDelete, canToggleStatus } = props;
  // state
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [disableRoleId, setDisableRoleId] = useState<string | null>(null);
  const [enableRoleId, setEnableRoleId] = useState<string | null>(null);
  // store hooks
  const { getRoleDetailsByRoleId } = useRoleManagement();

  if (!roleIds) return <RolesAndSchemesListLoader />;

  return (
    <>
      {editRoleId && (
        <EditRoleModal
          isOpen={!!editRoleId}
          onClose={() => setEditRoleId(null)}
          workspaceSlug={workspaceSlug}
          roleId={editRoleId}
        />
      )}
      {deleteRoleId && (
        <DeleteRoleModal
          isOpen={!!deleteRoleId}
          onClose={() => setDeleteRoleId(null)}
          workspaceSlug={workspaceSlug}
          roleId={deleteRoleId}
          namespace={namespace}
        />
      )}
      {disableRoleId && (
        <DisableRoleModal
          isOpen={!!disableRoleId}
          onClose={() => setDisableRoleId(null)}
          workspaceSlug={workspaceSlug}
          roleId={disableRoleId}
          namespace={namespace}
        />
      )}
      {enableRoleId && (
        <EnableRoleModal
          isOpen={!!enableRoleId}
          onClose={() => setEnableRoleId(null)}
          workspaceSlug={workspaceSlug}
          roleId={enableRoleId}
        />
      )}
      <div className="grid grid-cols-1 gap-4">
        {roleIds.map((roleId) => {
          const role = getRoleDetailsByRoleId(roleId);
          if (!role) return null;

          return (
            <RoleCard
              key={roleId}
              role={role}
              canEdit={canEdit(role.id)}
              canDelete={canDelete(role.id)}
              canToggleStatus={canToggleStatus(role.id)}
              onEdit={() => setEditRoleId(role.id)}
              onDelete={() => setDeleteRoleId(role.id)}
              onDisable={() => setDisableRoleId(role.id)}
              onEnable={() => setEnableRoleId(role.id)}
            />
          );
        })}
      </div>
    </>
  );
});
