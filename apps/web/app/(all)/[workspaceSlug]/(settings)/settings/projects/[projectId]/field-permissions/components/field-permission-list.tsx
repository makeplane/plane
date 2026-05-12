/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Calendar, CalendarCheck, CalendarClock, Trash2, type LucideIcon } from "lucide-react";
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

type TPermissionRowConfig = {
  key: EProjectFieldPermissionKey;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
};

type TPermissionSection = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  destructive?: boolean;
  rows: TPermissionRowConfig[];
};

const PERMISSION_SECTIONS: TPermissionSection[] = [
  {
    id: "dates",
    titleKey: "project_settings.field_permissions.sections.dates",
    descriptionKey: "project_settings.field_permissions.sections.dates_description",
    rows: [
      {
        key: EProjectFieldPermissionKey.START_DATE,
        icon: Calendar,
        titleKey: "project_settings.field_permissions.rows.start_date.title",
        descriptionKey: "project_settings.field_permissions.rows.start_date.description",
      },
      {
        key: EProjectFieldPermissionKey.TARGET_DATE,
        icon: CalendarClock,
        titleKey: "project_settings.field_permissions.rows.target_date.title",
        descriptionKey: "project_settings.field_permissions.rows.target_date.description",
      },
      {
        key: EProjectFieldPermissionKey.COMPLETED_DATE,
        icon: CalendarCheck,
        titleKey: "project_settings.field_permissions.rows.completed_date.title",
        descriptionKey: "project_settings.field_permissions.rows.completed_date.description",
      },
    ],
  },
  {
    id: "destructive",
    titleKey: "project_settings.field_permissions.sections.destructive",
    descriptionKey: "project_settings.field_permissions.sections.destructive_description",
    destructive: true,
    rows: [
      {
        key: EProjectFieldPermissionKey.DELETE_WORK_ITEM,
        icon: Trash2,
        titleKey: "project_settings.field_permissions.rows.delete_work_item.title",
        descriptionKey: "project_settings.field_permissions.rows.delete_work_item.description",
      },
    ],
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

  const buildToggleHandler = (backendKey: string, value: boolean) => async () => {
    try {
      await store.updatePermissions(workspaceSlug, projectId, { [backendKey]: !value });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("project_settings.field_permissions.toast.update_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_settings.field_permissions.toast.update_error"),
      });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {PERMISSION_SECTIONS.map((section) => (
        <section key={section.id} className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-primary">{t(section.titleKey)}</h3>
            <p className="text-xs text-secondary">{t(section.descriptionKey)}</p>
          </div>

          <div className="flex flex-col gap-2">
            {section.rows.map(({ key, icon, titleKey, descriptionKey }) => {
              const backendKey = PROJECT_FIELD_PERMISSION_BACKEND_KEY[key];
              const value = permissions ? (permissions[backendKey] ?? false) : false;
              return (
                <FieldPermissionRow
                  key={key}
                  icon={icon}
                  titleKey={titleKey}
                  descriptionKey={descriptionKey}
                  value={value}
                  disabled={!isAdmin}
                  destructive={section.destructive}
                  onToggle={() => void buildToggleHandler(backendKey, value)()}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
});
