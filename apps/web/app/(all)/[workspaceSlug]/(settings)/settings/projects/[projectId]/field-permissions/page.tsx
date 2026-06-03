/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectFieldPermission } from "@/hooks/store/use-project-field-permission";
import { useUserPermissions } from "@/hooks/store/user";
// local
import { FieldPermissionList } from "./components/field-permission-list";
import { FieldPermissionsHeader } from "./header";

function FieldPermissionsSettingsPage() {
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const store = useProjectFieldPermission();

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails.name} - Field Permissions` : undefined;

  useSWR(
    workspaceSlug && projectId ? `PROJECT_FIELD_PERMISSIONS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId
      ? async () => {
          try {
            await store.fetchPermissions(workspaceSlug, projectId);
          } catch {
            setToast({ type: TOAST_TYPE.ERROR, title: t("project_settings.field_permissions.toast.update_error") });
          }
        }
      : null
  );

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  if (!workspaceSlug || !projectId) return null;

  return (
    <SettingsContentWrapper header={<FieldPermissionsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <SettingsHeading
          title={t("project_settings.settings.field_permissions.title")}
          description={t("project_settings.field_permissions.description")}
        />
        <div className="mt-6">
          <FieldPermissionList workspaceSlug={workspaceSlug} projectId={projectId} isAdmin={isAdmin} />
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

const FieldPermissionsSettingsPageObserved = observer(FieldPermissionsSettingsPage);
export default FieldPermissionsSettingsPageObserved;
