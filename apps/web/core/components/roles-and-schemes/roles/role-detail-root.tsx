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

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
// plane imports
import { getPermissionGroupsByNamespace } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { ChevronLeftIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { PermissionNamespace } from "@plane/types";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRoleManagement } from "@/hooks/store/use-role-management";
// local imports
import { AttachSchemesSidebar } from "./attach-schemes-sidebar";
import { CompactSchemePermissions } from "./compact-scheme-permissions";
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";

type Props = {
  workspaceSlug: string;
  namespace: PermissionNamespace;
  roleSlug: string;
};

export const RoleDetailRoot = observer(function RoleDetailRoot(props: Props) {
  const { workspaceSlug, namespace, roleSlug } = props;
  // state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { can } = usePermissionAccess();
  const { getRoleDetailsByRoleSlug, updateRole } = useRoleManagement();
  const { getSchemeDetailsBySchemeId } = usePermissionScheme();
  // derived values
  const role = getRoleDetailsByRoleSlug({ workspaceSlug, roleSlug, namespace });
  // auth
  const canEdit = role
    ? can({ resource: "custom_role", action: "edit", workspaceSlug, resourceMeta: { resourceId: role.id } })
    : false;

  const backUrl = `/${workspaceSlug}/settings/${namespace}-roles-and-schemes/?tab=roles`;
  const groups = useMemo(() => getPermissionGroupsByNamespace(namespace), [namespace]);

  const attachedSchemeIds = useMemo(() => role?.permission_schemes?.map((s) => s.id) || [], [role?.permission_schemes]);

  // handlers
  const handleSaveSchemes = useCallback(
    async (schemeIds: string[]) => {
      if (!role) return;
      try {
        await updateRole({ workspaceSlug, roleId: role.id, data: { permission_scheme_ids: schemeIds } });
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("workspace_settings.settings.roles_and_schemes.role_detail.error_toast_description"),
        });
      }
    },
    [role, workspaceSlug, updateRole, t]
  );

  if (!role) return null;

  return (
    <div className="size-full flex overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <SettingsContentWrapper>
          {/* Back button */}
          <div className="-ml-3">
            <Link to={backUrl} className={getButtonStyling("ghost", "base")}>
              <ChevronLeftIcon className="shrink-0 size-3.5" />
              {t("common.back")}
            </Link>
          </div>

          {/* Role header */}
          <div className="mt-4">
            <h2 className="text-xl font-semibold">{role.name}</h2>
            {role.description && <p className="text-sm text-tertiary mt-1">{role.description}</p>}
          </div>

          {/* Permission Schemes section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium">
                {t("workspace_settings.settings.roles_and_schemes.role_detail.permission_schemes_title")}
              </h3>
              {!role.is_system && canEdit && (
                <Button variant="secondary" size="lg" onClick={() => setIsSidebarOpen(true)}>
                  {t("workspace_settings.settings.roles_and_schemes.role_detail.attach_button")}
                </Button>
              )}
            </div>

            {attachedSchemeIds.length === 0 ? (
              <div className="border border-dashed border-subtle rounded-lg p-12 text-center">
                <p className="text-sm font-medium text-secondary">
                  {t("workspace_settings.settings.roles_and_schemes.role_detail.empty_title")}
                </p>
                <p className="text-xs text-tertiary mt-1">
                  {t("workspace_settings.settings.roles_and_schemes.role_detail.empty_description")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attachedSchemeIds.map((schemeId) => {
                  const scheme = getSchemeDetailsBySchemeId(schemeId);
                  if (!scheme) return null;
                  return <CompactSchemePermissions key={schemeId} scheme={scheme} groups={groups} />;
                })}
              </div>
            )}
          </div>
        </SettingsContentWrapper>
      </div>

      {/* Sidebar */}
      <AttachSchemesSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        workspaceSlug={workspaceSlug}
        namespace={namespace}
        attachedSchemeIds={attachedSchemeIds}
        onSave={handleSaveSchemes}
      />
    </div>
  );
});
