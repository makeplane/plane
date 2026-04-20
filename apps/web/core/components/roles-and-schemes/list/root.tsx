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
import { Link, useSearchParams } from "react-router";
// plane imports
import { SETTINGS_ROLES_AND_SCHEMES_TABS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TabNavigationList, TabNavigationItem } from "@plane/propel/tab-navigation";
import type { PermissionNamespace } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { usePermissionScheme } from "@/hooks/store/use-permission-scheme";
import { useRoleManagement } from "@/hooks/store/use-role-management";
// local imports
import { CreateRoleModal } from "../roles/create-role-modal";
import { RolesListTab } from "./roles-list-tab";
import { SchemesListTab } from "./schemes-list-tab";

type Props = {
  workspaceSlug: string;
  namespace: PermissionNamespace;
};

export const RolesAndSchemesListPageRoot = observer(function RolesAndSchemesListPageRoot(props: Props) {
  const { workspaceSlug, namespace } = props;
  // router
  const [searchParams, setSearchParams] = useSearchParams();
  // derived tab state from URL
  const activeTab = useMemo<"roles" | "schemes">(() => {
    const tab = searchParams.get("tab");
    return tab === "schemes" ? "schemes" : "roles";
  }, [searchParams]);
  const handleTabChange = useCallback(
    (tab: "roles" | "schemes") => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams]
  );
  // states
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  // store hooks
  const { can } = usePermissionAccess();
  const { getWorkspaceRoleIdsByWorkspaceSlug, getProjectRoleIdsByWorkspaceSlug } = useRoleManagement();
  const { getWorkspaceSchemeIdsByWorkspaceSlug, getProjectSchemeIdsByWorkspaceSlug } = usePermissionScheme();
  // derived values
  const roleIds =
    namespace === "workspace"
      ? getWorkspaceRoleIdsByWorkspaceSlug(workspaceSlug, "all")
      : getProjectRoleIdsByWorkspaceSlug(workspaceSlug, "all");
  const schemeIds =
    namespace === "workspace"
      ? getWorkspaceSchemeIdsByWorkspaceSlug(workspaceSlug)
      : getProjectSchemeIdsByWorkspaceSlug(workspaceSlug);
  // translation
  const { t } = useTranslation();
  // auth
  const canCreateCustomRoles = can({ resource: "custom_role", action: "create", workspaceSlug });
  const canEditCustomRole = useCallback(
    (roleId: string) =>
      can({ resource: "custom_role", action: "edit", workspaceSlug, resourceMeta: { resourceId: roleId } }),
    [can, workspaceSlug]
  );
  const canDeleteCustomRole = useCallback(
    (roleId: string) =>
      can({ resource: "custom_role", action: "delete", workspaceSlug, resourceMeta: { resourceId: roleId } }),
    [can, workspaceSlug]
  );

  return (
    <div className="mt-3">
      <CreateRoleModal
        isOpen={isCreateRoleModalOpen}
        onClose={() => setIsCreateRoleModalOpen(false)}
        namespace={namespace}
        workspaceSlug={workspaceSlug}
      />
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-subtle">
        <TabNavigationList>
          {SETTINGS_ROLES_AND_SCHEMES_TABS.map((tab) => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)} className="relative">
              <TabNavigationItem isActive={activeTab === tab.key}>{t(tab.i18n_label)}</TabNavigationItem>
              {activeTab === tab.key && (
                <span className="absolute -bottom-2 w-full left-1/2 -translate-x-1/2 h-0.5 bg-(--text-color-icon-primary) rounded-t-md transition-all duration-300" />
              )}
            </button>
          ))}
        </TabNavigationList>
        <div className="shrink-0 flex items-center gap-3">
          {activeTab === "roles" && canCreateCustomRoles && (
            <Button variant="primary" size="lg" className="shrink-0" onClick={() => setIsCreateRoleModalOpen(true)}>
              {t("workspace_settings.settings.roles_and_schemes.create_role.button_label")}
            </Button>
          )}
          {activeTab === "schemes" && canCreateCustomRoles && (
            <Link to="schemes/create" relative="path" className={cn(getButtonStyling("primary", "lg"), "shrink-0")}>
              {t("workspace_settings.settings.roles_and_schemes.create_scheme.button_label")}
            </Link>
          )}
        </div>
      </div>
      <div className="mt-4">
        {activeTab === "roles" && (
          <RolesListTab
            workspaceSlug={workspaceSlug}
            namespace={namespace}
            roleIds={roleIds}
            canEdit={canEditCustomRole}
            canDelete={canDeleteCustomRole}
            canToggleStatus={canEditCustomRole}
          />
        )}
        {activeTab === "schemes" && (
          <SchemesListTab
            workspaceSlug={workspaceSlug}
            namespace={namespace}
            schemeIds={schemeIds}
            canEdit={canEditCustomRole}
            canDelete={canDeleteCustomRole}
          />
        )}
      </div>
    </div>
  );
});
