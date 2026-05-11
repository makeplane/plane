/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EProjectFieldPermissionKey, PROJECT_FIELD_PERMISSION_BACKEND_KEY } from "@plane/types";
// hooks
import { useProjectFieldPermission } from "@/hooks/store/use-project-field-permission";
// components
import { FieldPermissionRow } from "./field-permission-row";

type TFieldPermissionListProps = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

const PERMISSION_ROWS: {
  key: EProjectFieldPermissionKey;
  titleKey: string;
  descriptionKey: string;
}[] = [
  {
    key: EProjectFieldPermissionKey.COMPLETED_DATE,
    titleKey: "project_settings.field_permissions.rows.completed_date.title",
    descriptionKey: "project_settings.field_permissions.rows.completed_date.description",
  },
  {
    key: EProjectFieldPermissionKey.TARGET_DATE,
    titleKey: "project_settings.field_permissions.rows.target_date.title",
    descriptionKey: "project_settings.field_permissions.rows.target_date.description",
  },
  {
    key: EProjectFieldPermissionKey.START_DATE,
    titleKey: "project_settings.field_permissions.rows.start_date.title",
    descriptionKey: "project_settings.field_permissions.rows.start_date.description",
  },
  {
    key: EProjectFieldPermissionKey.DELETE_WORK_ITEM,
    titleKey: "project_settings.field_permissions.rows.delete_work_item.title",
    descriptionKey: "project_settings.field_permissions.rows.delete_work_item.description",
  },
];

export const FieldPermissionList = observer(function FieldPermissionList({
  workspaceSlug,
  projectId,
  isAdmin,
}: TFieldPermissionListProps) {
  const { t } = useTranslation();
  const store = useProjectFieldPermission();
  const cacheKey = `${workspaceSlug}:${projectId}`;
  const permissions = store.permissionsMap.get(cacheKey);

  return (
    <div className="flex flex-col gap-3">
      {PERMISSION_ROWS.map(({ key, titleKey, descriptionKey }) => {
        const backendKey = PROJECT_FIELD_PERMISSION_BACKEND_KEY[key];
        const value = permissions ? (permissions[backendKey] ?? false) : false;

        const handleToggle = async () => {
          try {
            await store.updatePermissions(workspaceSlug, projectId, { [backendKey]: !value });
            setToast({ type: TOAST_TYPE.SUCCESS, title: t("project_settings.field_permissions.toast.update_success") });
          } catch {
            setToast({ type: TOAST_TYPE.ERROR, title: t("project_settings.field_permissions.toast.update_error") });
          }
        };

        return (
          <FieldPermissionRow
            key={key}
            titleKey={titleKey}
            descriptionKey={descriptionKey}
            value={value}
            disabled={!isAdmin}
            onToggle={() => void handleToggle()}
          />
        );
      })}
    </div>
  );
});
